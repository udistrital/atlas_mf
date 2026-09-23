import {
  HttpClient
} from '@angular/common/http';

import {
  Injectable
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

export interface CaptchaVerificationResponse {
  success: boolean;
  message?: string;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CaptchaVerificationService {

  constructor(
    private readonly http:
      HttpClient
  ) {}

  verify(
    token: string
  ): Observable<
    CaptchaVerificationResponse
  > {

    return this.http.post<
      CaptchaVerificationResponse
    >(
      environment
        .TURNSTILE_VERIFY_URL,

      {
        token
      },

      {
        withCredentials: true
      }
    );
  }
}
