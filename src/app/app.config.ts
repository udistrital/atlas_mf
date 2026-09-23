import { ApplicationConfig} from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { readOnlyInterceptor } from './core/http/read-only.interceptor';
import { suspiciousActivityInterceptor } from './core/security/suspicious-activity.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top'
      })
    ),

    {
      provide: APP_BASE_HREF,
      useValue: '/'
    },

    provideHttpClient(
      withXhr(),
      withInterceptors([
        readOnlyInterceptor,
        authInterceptor,
        suspiciousActivityInterceptor
      ])
    ),

    provideTranslateService({
      fallbackLang: 'es',
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json'
      })
    })
  ]
};
