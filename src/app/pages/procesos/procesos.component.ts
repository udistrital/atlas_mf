import { Component, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, of, switchMap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { ObservatoriosReadService } from '../../core/http/observatorios-read.service';
import { Factor, Proceso } from '../../core/models/domain.models';
import { NavigationStateService } from '../../core/state/navigation-state.service';

@Component({
    selector: 'app-procesos',
    imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    LoadingStateComponent
],
    templateUrl: './procesos.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./procesos.component.scss']
})
export class ProcesosComponent implements OnInit {
  readonly proceso = signal<Proceso | null>(null);
  readonly factores = signal<Factor[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly search = signal('');

  readonly factoresFiltrados = computed(() => {
    const query = this.search().trim().toLowerCase();

    if (!query) {
      return this.factores();
    }

    return this.factores().filter((factor) => {
      return [
        factor.factor_id,
        factor.id,
        factor.nombre,
        factor.descripcion,
        factor.calificacion
      ].some((value) =>
        String(value ?? '').toLowerCase().includes(query)
      );
    });
  });

  constructor(
    private readonly service: ObservatoriosReadService,
    private readonly router: Router,
    private readonly state: NavigationStateService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');
    this.proceso.set(null);
    this.factores.set([]);

    this.service.obtenerProcesoActivo().pipe(
      switchMap((proceso) => {
        if (!proceso) {
          this.error.set('No se encontró un proceso activo para consultar.');
          return of([]);
        }

        this.proceso.set(proceso);
        this.state.setProceso(proceso);

        const procesoId = this.obtenerProcesoId(proceso);

        if (!procesoId) {
          this.error.set('El proceso activo no tiene un identificador válido.');
          return of([]);
        }

        return this.service.listarFactoresPorProceso(procesoId);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (factores) => {
        this.factores.set(factores);
      },
      error: () => {
        this.error.set('No fue posible cargar los factores asociados.');
      }
    });
  }

  abrirFactor(factor: Factor): void {
    const procesoId = this.obtenerProcesoId(this.proceso());
    const factorId = factor.factor_id ?? factor.id;

    if (!procesoId || !factorId) {
      return;
    }

    this.state.setFactor(factor);

    void this.router.navigate([
      '/procesos',
      procesoId,
      'factores',
      factorId,
      'estructuras'
    ]);
  }

  obtenerProcesoId(proceso: Proceso | null): string | number | null {
    return proceso?.proceso_id ?? proceso?.id ?? null;
  }

  etiquetaFactor(factor: Factor, index: number): string {
    return String(factor.factor_id ?? factor.id ?? `Factor ${index + 1}`);
  }
}
