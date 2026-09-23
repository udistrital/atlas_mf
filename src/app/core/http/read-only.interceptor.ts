import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  throwError
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

const allowedMethods =
  new Set([
    'GET',
    'HEAD',
    'OPTIONS'
  ]);

export const readOnlyInterceptor:
  HttpInterceptorFn = (
    req,
    next
  ) => {

    const isTurnstileVerify =
      req.method === 'POST' &&
      req.url ===
      environment
        .TURNSTILE_VERIFY_URL;

    if (isTurnstileVerify) {
      return next(req);
    }

    if (
      allowedMethods.has(
        req.method.toUpperCase()
      )
    ) {
      return next(req);
    }

    return throwError(
      () =>
        new HttpErrorResponse({
          status: 405,

          statusText:
            'Método bloqueado por cliente de solo lectura',

          url: req.url,

          error: {
            detail:
              'atlas_mf solo permite consultas.'
          }
        })
    );
  };
