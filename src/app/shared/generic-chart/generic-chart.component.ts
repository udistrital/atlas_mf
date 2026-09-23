import { Component, OnChanges, ChangeDetectionStrategy, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ObservatoriosReadService } from '../../core/http/observatorios-read.service';

interface ChartPoint { label: string; value: number; width: number; }

@Component({
    selector: 'app-generic-chart',
    imports: [CommonModule, MatProgressSpinnerModule],
    templateUrl: './generic-chart.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './generic-chart.component.scss'
})
export class GenericChartComponent implements OnChanges {
  readonly dashboardId = input.required<string | number>();
  readonly graficoId = input.required<string | number>();
  readonly tipo = input('');
  readonly titulo = input('Gráfico');

  readonly loading = signal(false);
  readonly error = signal('');
  readonly raw = signal<Record<string, unknown> | null>(null);
  readonly points = signal<ChartPoint[]>([]);

  constructor(private readonly service: ObservatoriosReadService) {}

  ngOnChanges(): void {
    const dashboardId = this.dashboardId();
    const graficoId = this.graficoId();

    if (!dashboardId || !graficoId) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.raw.set(null);
    this.points.set([]);

    this.service
      .construirGrafico(
        dashboardId,
        graficoId
      )
      .subscribe({
        next: data => {
          this.raw.set(data);
          this.points.set(this.toPoints(data));
          this.loading.set(false);
        },
        error: () => {
          this.error.set(
            'No fue posible construir la gráfica.'
          );
          this.loading.set(false);
        }
      });
  }

  private toPoints(payload: Record<string, unknown>): ChartPoint[] {
    const data = payload['data'];
    if (!data || typeof data !== 'object') return [];

    const record = data as Record<string, unknown>;
    const etiquetasString = Array.isArray(record['etiquetas_as_string']) ? record['etiquetas_as_string'] : [];
    const etiquetas = etiquetasString.length > 0 ? etiquetasString : (Array.isArray(record['etiquetas']) ? record['etiquetas'] : []);
    const metrica = Array.isArray(record['metrica']) ? record['metrica'] : [];

    const numericValues = metrica.map((value) => Number(value)).filter((value) => Number.isFinite(value));
    const max = Math.max(...numericValues, 1);

    return numericValues.map((value, index) => ({
      label: String(etiquetas[index] ?? `Dato ${index + 1}`),
      value,
      width: Math.max(3, Math.round((value / max) * 100))
    }));
  }
}
