import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  inject
} from '@angular/core';

import {
  catchError,
  throwError
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

import {
  SuspiciousActivityService
} from './suspicious-activity.service';

export const suspiciousActivityInterceptor:
  HttpInterceptorFn = (
    req,
    next
  ) => {

  const activity =
    inject(
      SuspiciousActivityService
    );

  const isAtlasApi =
    req.url.startsWith(
      environment.MAIN_BACKEND
    );

  if (!isAtlasApi) {
    return next(req);
  }

  return next(req).pipe(

    catchError(
      (
        error: unknown
      ) => {

        if (
          error instanceof
            HttpErrorResponse &&
          error.status === 428 &&
          error.error?.code ===
            'TURNSTILE_REQUIRED'
        ) {

          activity.requireCaptcha(
            error.error?.message ||
            'Se requiere una verificación de seguridad.'
          );
        }

        return throwError(
          () => error
        );
      }
    )
  );
};
