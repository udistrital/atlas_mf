

import {
  Component,
  signal,
  ChangeDetectionStrategy,
  input
} from '@angular/core';

import {
    MatDialog,
    MatDialogModule
} from '@angular/material/dialog';

import {
    MatIconModule
} from '@angular/material/icon';

import {
    MatPaginatorModule,
    PageEvent
} from '@angular/material/paginator';

import {
    EstructuraEvidencia
} from '../../../../core/models/domain.models';

import {
    LoadingStateComponent
} from '../../../../shared/loading-state/loading-state.component';

import {
    FactorEstructurasFacade
} from '../../data-access/factor-estructuras.facade';

import {
    ContenidoEstructura
} from '../../models/estructura-view.models';

import {
    DetalleRegistroDialogComponent
} from '../detalle-registro-dialog/detalle-registro-dialog.component';

@Component({
    selector: 'app-estructura-evidencia',
    imports: [
    MatDialogModule,
    MatIconModule,
    MatPaginatorModule,
    LoadingStateComponent
],
    templateUrl: './estructura-evidencia.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './estructura-evidencia.component.scss'
})
export class EstructuraEvidenciaComponent {
    readonly estructura = input.required<EstructuraEvidencia>();

    readonly abierta =
        signal(false);

    readonly loading =
        signal(false);

    readonly error =
        signal('');

    readonly contenido =
        signal<ContenidoEstructura | null>(
            null
        );

    pageIndex = 0;
    pageSize = 10;

    constructor(
        private readonly facade:
            FactorEstructurasFacade,

        private readonly dialog:
            MatDialog
    ) { }

    toggle(): void {
        const siguienteEstado =
            !this.abierta();

        this.abierta.set(
            siguienteEstado
        );

        /*
         * Solo consulta la primera vez
         * que se abre.
         */
        if (
            siguienteEstado &&
            !this.contenido()
        ) {
            this.cargarContenido();
        }
    }

    cambiarPagina(
        event: PageEvent
    ): void {
        this.pageIndex =
            event.pageIndex;

        this.pageSize =
            event.pageSize;

        this.cargarContenido();
    }

    verFila(
        fila: Record<string, unknown>
    ): void {
        const contenido =
            this.contenido();

        if (!contenido) {
            return;
        }

        /*
         * Documental: abre el PDF.
         */
        if (
            contenido.tipo === 'documental'
        ) {
            this.abrirDocumento(fila);
            return;
        }

        /*
         * Tabla: abre modal de solo lectura.
         */
        this.dialog.open(
            DetalleRegistroDialogComponent,
            {
                width: '760px',
                maxWidth: '95vw',

                data: {
                    titulo:
                        contenido.estructura.nombre ||
                        'Detalle del registro',

                    columnas:
                        contenido.columnas,

                    fila
                }
            }
        );
    }

    valor(
        fila: Record<string, unknown>,
        columna: string
    ): string {
        const value = fila[columna];

        if (
            value === null ||
            value === undefined
        ) {
            return '';
        }

        if (
            typeof value === 'boolean'
        ) {
            return value
                ? 'Sí'
                : 'No';
        }

        return typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);
    }

    tipoLabel(): string {
        return this.facade.tipoEvidencia(
            this.estructura()
        ) === 'documental'
            ? 'Documental'
            : 'Tabla';
    }

    private cargarContenido(): void {
        if (this.loading()) {
            return;
        }

        this.loading.set(true);
        this.error.set('');

        this.facade
            .cargarContenido(
                this.estructura(),
                this.pageIndex,
                this.pageSize
            )
            .subscribe({
                next: (contenido) => {
                    this.contenido.set(contenido);
                    this.loading.set(false);
                },

                error: (error) => {
                    console.error(
                        'Error cargando contenido de la estructura:',
                        error
                    );

                    this.error.set(
                        'No fue posible consultar el contenido de esta estructura.'
                    );

                    this.loading.set(false);
                }
            });
    }
    private abrirDocumento(
        fila: Record<string, unknown>
    ): void {
        /*
         * Se abre antes de la petición para
         * evitar bloqueo de ventanas emergentes.
         */
        const ventana = window.open(
            '',
            '_blank'
        );

        this.facade
            .obtenerUrlDocumento(fila)
            .subscribe({
                next: (url) => {
                    if (ventana) {
                        ventana.location.href = url;
                    } else {
                        window.open(
                            url,
                            '_blank'
                        );
                    }

                    window.setTimeout(
                        () =>
                            URL.revokeObjectURL(url),
                        60_000
                    );
                },

                error: (error) => {
                    ventana?.close();

                    console.error(
                        'Error abriendo documento:',
                        error
                    );

                    this.error.set(
                        error instanceof Error
                            ? error.message
                            : 'No fue posible abrir el documento.'
                    );
                }
            });
    }
}
