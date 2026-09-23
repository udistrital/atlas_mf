import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';

import {
  TurnstileApi,
  TurnstileLoaderService
} from '../../core/security/turnstile-loader.service';

@Component({
  selector: 'app-turnstile-widget',

  standalone: true,

  templateUrl:
    './turnstile-widget.component.html',

  styleUrl:
    './turnstile-widget.component.scss'
})
export class TurnstileWidgetComponent
  implements AfterViewInit, OnDestroy {

  @Input({
    required: true
  })
  siteKey = '';

  @Input()
  action = 'atlas_external_access';

  @Output()
  readonly tokenChange =
    new EventEmitter<string>();

  @Output()
  readonly expired =
    new EventEmitter<void>();

  @Output()
  readonly widgetError =
    new EventEmitter<string>();

  @ViewChild(
    'container',
    {
      static: true
    }
  )
  private container!:
    ElementRef<HTMLDivElement>;

  private api?: TurnstileApi;

  private widgetId?: string;

  constructor(
    private readonly loader:
      TurnstileLoaderService
  ) { }

  async ngAfterViewInit(): Promise<void> {

    try {

      this.api =
        await this.loader.load();

      this.widgetId =
        this.api.render(
          this.container.nativeElement,
          {
            sitekey:
              this.siteKey,

            action:
              this.action,

            theme:
              'auto',

            retry:
              'never',

            callback:
              (
                token: string
              ) => {

                this.tokenChange.emit(
                  token
                );
              },

            'expired-callback':
              () => {

                this.expired.emit();
              },

            'timeout-callback':
              () => {

                this.widgetError.emit(
                  'La verificación agotó el tiempo disponible.'
                );
              },

            'error-callback':
              (
                code?: string
              ) => {

                this.widgetError.emit(
                  code ||
                  'Error al realizar la verificación.'
                );
              }
          }
        );

    } catch (error) {

      console.error(
        'Error cargando Turnstile:',
        error
      );

      this.widgetError.emit(
        'No fue posible cargar la verificación.'
      );
    }
  }

  reset(): void {

    if (
      this.api &&
      this.widgetId
    ) {

      this.api.reset(
        this.widgetId
      );
    }
  }

  ngOnDestroy(): void {

    if (
      this.api &&
      this.widgetId
    ) {

      this.api.remove(
        this.widgetId
      );
    }
  }
}
