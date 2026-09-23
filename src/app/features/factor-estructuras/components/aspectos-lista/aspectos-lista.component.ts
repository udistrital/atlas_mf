

import {
  Component,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  input
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import {
  Aspecto,
  EstructuraEvidencia
} from '../../../../core/models/domain.models';

import {
  LoadingStateComponent
} from '../../../../shared/loading-state/loading-state.component';

import {
  FactorEstructurasFacade
} from '../../data-access/factor-estructuras.facade';

import {
  EstructuraEvidenciaComponent
} from '../estructura-evidencia/estructura-evidencia.component';

@Component({
    selector: 'app-aspectos-lista',
    imports: [
    MatIconModule,
    LoadingStateComponent,
    EstructuraEvidenciaComponent
],
    templateUrl: './aspectos-lista.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './aspectos-lista.component.scss'
})
export class AspectosListaComponent
  implements OnInit
{
  readonly caracteristicaId = input.required<string | number>();

  readonly aspectos =
    signal<Aspecto[]>([]);

  readonly loading =
    signal(false);

  readonly error =
    signal('');

  readonly aspectoAbiertoId =
    signal<string | null>(null);

  readonly estructurasPorAspecto =
    signal<
      Record<
        string,
        EstructuraEvidencia[]
      >
    >({});

  readonly cargandoEstructuras =
    signal<Record<string, boolean>>({});

  readonly errorEstructuras =
    signal<Record<string, string>>({});

  constructor(
    private readonly facade:
      FactorEstructurasFacade
  ) {}

  ngOnInit(): void {
    this.cargarAspectos();
  }

  toggleAspecto(
    aspecto: Aspecto
  ): void {
    const key = this.key(aspecto.id);

    if (!key) {
      return;
    }

    if (
      this.aspectoAbiertoId() === key
    ) {
      this.aspectoAbiertoId.set(null);
      return;
    }

    this.aspectoAbiertoId.set(key);

    /*
     * Si ya se almacenaron las estructuras,
     * no se vuelve a consultar.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        this.estructurasPorAspecto(),
        key
      )
    ) {
      return;
    }

    /*
     * El endpoint de aspectos ya devuelve
     * estructuras_evidencias.
     */
    if (
      Array.isArray(
        aspecto.estructuras_evidencias
      )
    ) {
      this.guardarEstructuras(
        key,
        aspecto.estructuras_evidencias.filter(
          (item) =>
            item.activo !== false
        )
      );

      return;
    }

    /*
     * Respaldo por si el endpoint no las
     * devuelve embebidas.
     */
    this.cargarEstructuras(aspecto);
  }

  estaAbierto(
    aspecto: Aspecto
  ): boolean {
    return (
      this.aspectoAbiertoId() ===
      this.key(aspecto.id)
    );
  }

  estructuras(
    aspecto: Aspecto
  ): EstructuraEvidencia[] {
    return (
      this.estructurasPorAspecto()[
        this.key(aspecto.id)
      ] || []
    );
  }

  estaCargandoEstructuras(
    aspecto: Aspecto
  ): boolean {
    return Boolean(
      this.cargandoEstructuras()[
        this.key(aspecto.id)
      ]
    );
  }

  mensajeErrorEstructuras(
    aspecto: Aspecto
  ): string {
    return (
      this.errorEstructuras()[
        this.key(aspecto.id)
      ] || ''
    );
  }

  private cargarAspectos(): void {
    this.loading.set(true);
    this.error.set('');

    this.facade
      .cargarAspectos(
        this.caracteristicaId()
      )
      .subscribe({
        next: (aspectos) => {
          this.aspectos.set(aspectos);

          /*
           * Guarda las estructuras que ya
           * vienen dentro del aspecto.
           */
          for (const aspecto of aspectos) {
            const key = this.key(
              aspecto.id
            );

            if (
              key &&
              Array.isArray(
                aspecto.estructuras_evidencias
              )
            ) {
              this.guardarEstructuras(
                key,
                aspecto.estructuras_evidencias
                  .filter(
                    (item) =>
                      item.activo !== false
                  )
              );
            }
          }

          this.loading.set(false);
        },

        error: (error) => {
          console.error(
            'Error cargando aspectos:',
            error
          );

          this.error.set(
            'No fue posible cargar los aspectos de la característica.'
          );

          this.loading.set(false);
        }
      });
  }

  private cargarEstructuras(
    aspecto: Aspecto
  ): void {
    const key = this.key(aspecto.id);

    if (
      !key ||
      aspecto.id === null ||
      aspecto.id === undefined
    ) {
      return;
    }

    this.cargandoEstructuras.update(
      (state) => ({
        ...state,
        [key]: true
      })
    );

    this.facade
      .cargarEstructuras(aspecto.id)
      .subscribe({
        next: (estructuras) => {
          this.guardarEstructuras(
            key,
            estructuras
          );

          this.cargandoEstructuras.update(
            (state) => ({
              ...state,
              [key]: false
            })
          );
        },

        error: (error) => {
          console.error(
            'Error cargando estructuras:',
            error
          );

          this.errorEstructuras.update(
            (state) => ({
              ...state,

              [key]:
                'No fue posible cargar las estructuras de evidencia.'
            })
          );

          this.cargandoEstructuras.update(
            (state) => ({
              ...state,
              [key]: false
            })
          );
        }
      });
  }

  private guardarEstructuras(
    key: string,
    estructuras: EstructuraEvidencia[]
  ): void {
    this.estructurasPorAspecto.update(
      (state) => ({
        ...state,

        [key]: [...estructuras].sort(
          (a, b) =>
            String(a.id ?? '').localeCompare(
              String(b.id ?? ''),
              undefined,
              {
                numeric: true,
                sensitivity: 'base'
              }
            )
        )
      })
    );
  }

  private key(
    value:
      | string
      | number
      | null
      | undefined
  ): string {
    return value === null ||
      value === undefined
      ? ''
      : String(value);
  }
}
