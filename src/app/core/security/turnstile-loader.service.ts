import { Injectable } from '@angular/core';

export interface TurnstileRenderOptions {

  sitekey: string;

  action?: string;

  callback:
    (token: string) => void;

  'expired-callback'?:
    () => void;

  'timeout-callback'?:
    () => void;

  'error-callback'?:
    (
      errorCode?: string
    ) => void;

  retry?:
    'auto' |
    'never';

  'retry-interval'?:
    number;

  theme?:
    'light' |
    'dark' |
    'auto';

  size?:
    'normal' |
    'compact' |
    'flexible';
}

export interface TurnstileApi {
  render(
    container: HTMLElement,
    options: TurnstileRenderOptions
  ): string;

  reset(widgetId?: string): void;

  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TurnstileLoaderService {

  private loadPromise:
    Promise<TurnstileApi> | null = null;

  load(): Promise<TurnstileApi> {

    if (window.turnstile) {
      return Promise.resolve(
        window.turnstile
      );
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise =
      new Promise<TurnstileApi>(
        (resolve, reject) => {

          const existingScript =
            document.querySelector<HTMLScriptElement>(
              'script[data-atlas-turnstile]'
            );

          if (existingScript) {
            this.waitForApi(
              resolve,
              reject
            );

            return;
          }

          const script =
            document.createElement(
              'script'
            );

          script.src =
            'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

          script.async = true;
          script.defer = true;

          script.dataset[
            'atlasTurnstile'
          ] = 'true';

          script.onload = () => {
            this.waitForApi(
              resolve,
              reject
            );
          };

          script.onerror = () => {

            script.remove();

            this.loadPromise = null;

            reject(
              new Error(
                'No fue posible cargar Cloudflare Turnstile.'
              )
            );
          };

          document.head.appendChild(
            script
          );
        }
      );

    return this.loadPromise;
  }

  private waitForApi(
    resolve: (
      api: TurnstileApi
    ) => void,
    reject: (
      reason?: unknown
    ) => void
  ): void {

    let attempts = 0;

    const interval =
      window.setInterval(() => {

        attempts += 1;

        if (window.turnstile) {
          window.clearInterval(
            interval
          );

          resolve(
            window.turnstile
          );

          return;
        }

        if (attempts >= 100) {

          window.clearInterval(
            interval
          );

          this.loadPromise = null;

          reject(
            new Error(
              'Cloudflare Turnstile no estuvo disponible.'
            )
          );
        }

      }, 100);
  }
}
