import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  CommonModule
} from '@angular/common';

import {
  Component,
  ViewChild,
  effect,
  signal
} from '@angular/core';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  finalize
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

import {
  CaptchaVerificationResponse,
  CaptchaVerificationService
} from '../../core/security/captcha-verification.service';

import {
  SuspiciousActivityService
} from '../../core/security/suspicious-activity.service';

import {
  TurnstileWidgetComponent
} from '../../shared/turnstile-widget/turnstile-widget.component';

@Component({
  selector: 'app-captcha-gate',

  imports: [
    CommonModule,
    MatIconModule,
    TurnstileWidgetComponent
  ],

  templateUrl:
    './captcha-gate.component.html',

  styleUrl:
    './captcha-gate.component.scss'
})
export class CaptchaGateComponent {

  readonly siteKey =
    environment.TURNSTILE_SITE_KEY;

  readonly action =
    environment.TURNSTILE_ACTION;

  readonly captchaRequired =
    this.activity.captchaRequired;

  readonly reason =
    this.activity.reason;

  readonly verifying =
    signal(false);

  readonly verificationError =
    signal('');

  private lastToken:
    string | null = null;

  @ViewChild(
    TurnstileWidgetComponent
  )
  private widget?:
    TurnstileWidgetComponent;

  constructor(
    private readonly activity:
      SuspiciousActivityService,

    private readonly verification:
      CaptchaVerificationService
  ) {

    effect(() => {

      if (
        this.captchaRequired()
      ) {

        console.warn(
          'Verificación requerida:',
          this.reason()
        );
      }
    });
  }

  onToken(
    token: string
  ): void {

    /*
     * Evita:
     * - tokens vacíos;
     * - dos verificaciones simultáneas;
     * - verificar dos veces el mismo token.
     */
    if (
      !token ||
      this.verifying() ||
      token === this.lastToken
    ) {
      return;
    }

    this.lastToken = token;

    this.verifying.set(
      true
    );

    this.verificationError.set(
      ''
    );

    this.verification
      .verify(token)
      .pipe(
        finalize(
          () => {

            this.verifying.set(
              false
            );
          }
        )
      )
      .subscribe({

        next: (
          response:
            CaptchaVerificationResponse
        ) => {

          if (!response.success) {

            this.verificationError.set(
              response.message ||
              'La verificación no fue válida.'
            );

            return;
          }

          this.activity
            .markCaptchaVerified();

          /*
           * La petición que recibió el 428
           * ya terminó con error.
           *
           * Recargamos para que el flujo
           * normal vuelva a consultar el API
           * utilizando la clearance generada.
           */
          window.location.reload();
        },

        error: (
          error:
            HttpErrorResponse
        ) => {

          console.error(
            'Error verificando Turnstile:',
            error
          );

          if (
            error.status === 503 &&
            error.error?.code ===
              'TURNSTILE_UNAVAILABLE'
          ) {

            this.verificationError.set(
              'La verificación de seguridad está temporalmente indisponible.'
            );

            /*
             * El API Go ya activó su modo
             * degradado.
             */
            window.setTimeout(
              () => {
                window.location.reload();
              },
              1000
            );

            return;
          }

          if (
            error.status === 429
          ) {

            this.verificationError.set(
              'Se realizaron demasiados intentos de verificación. Espera un momento antes de volver a intentar.'
            );

            return;
          }

          if (
            error.status === 400
          ) {

            this.verificationError.set(
              error.error?.message ||
              'La verificación no fue válida.'
            );

            return;
          }

          this.verificationError.set(
            'No fue posible validar la verificación.'
          );

          /*
           * MUY IMPORTANTE:
           *
           * NO hacer:
           *
           * this.widget?.reset();
           *
           * porque eso generaba el bucle:
           *
           * token
           * → verify
           * → error
           * → reset
           * → token nuevo
           * → verify
           * → ...
           */
        }
      });
  }

  retryTurnstile(): void {

    if (
      this.verifying()
    ) {
      return;
    }

    this.lastToken = null;

    this.verificationError.set(
      ''
    );

    this.widget?.reset();
  }

  onExpired(): void {

    /*
     * El token expirado ya no debe
     * considerarse válido para detectar
     * duplicados.
     */
    this.lastToken = null;

    this.verificationError.set(
      'La verificación expiró. Inténtalo nuevamente.'
    );
  }

  onWidgetError(
    error: string
  ): void {

    this.verificationError.set(
      error
    );
  }
}
