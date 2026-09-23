import {Component, ViewEncapsulation, ChangeDetectionStrategy, input} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';

import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    imports: [MatSelectModule, RouterModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    encapsulation: ViewEncapsulation.Emulated
})
export class HeaderComponent{
  readonly appname = input<any>();
  readonly menuApps = input<boolean>(false);
  readonly notificaciones = input<boolean>(false);


  basePathAssets = environment.PRUEBAS_ASSETS;

  langs: string[] = ['es', 'en']; 
  langCookie: string = 'en';

  constructor(
    private readonly translate: TranslateService
  ) {
    this.langCookie = getCookie('lang') || 'es';

    this.translate
      .use(this.langCookie)
      .subscribe();
  }

  cambiarIdioma(lang: string): void {
    this.langCookie = lang;

    setCookie('lang', lang);

    window.dispatchEvent(
      new CustomEvent('lang', {
        detail: { answer: lang }
      })
    );

    this.translate
      .use(lang)
      .subscribe();
  }
}

export function setCookie(name: string, val: string) {
  const date = new Date();
  date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días
  document.cookie = `${name}=${val}; expires=${date.toUTCString()}; path=/`;
}

export function getCookie(name: string): string | undefined {
  const value = '; ' + document.cookie;
  const parts = value.split('; ' + name + '=');
  if (parts.length == 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}
