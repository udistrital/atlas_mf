import {
  Injectable,
  signal
} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SuspiciousActivityService {

  readonly captchaRequired =
    signal(false);

  readonly reason =
    signal('');

  requireCaptcha(
    reason: string
  ): void {

    this.reason.set(
      reason
    );

    this.captchaRequired.set(
      true
    );
  }

  markCaptchaVerified(): void {

    this.reason.set('');

    this.captchaRequired.set(
      false
    );
  }
}
