import { Component, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CampoEstructura, Dashboard, EstructuraEvidencia, Grafico } from '../../core/models/domain.models';
import { ObservatoriosReadService } from '../../core/http/observatorios-read.service';
import { NavigationStateService } from '../../core/state/navigation-state.service';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { DynamicDataTableComponent } from '../../shared/data-table/dynamic-data-table.component';
import { GenericChartComponent } from '../../shared/generic-chart/generic-chart.component';

@Component({
  selector: 'app-caracteristica-consulta',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTabsModule, MatPaginatorModule, LoadingStateComponent, DynamicDataTableComponent, GenericChartComponent],
  templateUrl: './caracteristica-consulta.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './caracteristica-consulta.component.scss'
})
export class CaracteristicaConsultaComponent implements OnInit {
  readonly estructura = signal<EstructuraEvidencia | null>(null);
  readonly datos = signal<Record<string, unknown>[]>([]);
  readonly datosArchivo = signal<Record<string, unknown>[]>([]);
  readonly paneles = signal<Dashboard[]>([]);
  readonly graficosPorPanel = signal<Record<string, Grafico[]>>({});
  readonly loading = signal(false);
  readonly error = signal('');
  readonly loadingDocs = signal(false);
  readonly loadingPaneles = signal(false);

  page = 0;
  pageSize = 10;
  total = 0;
  docsPage = 0;
  docsPageSize = 10;
  docsTotal = 0;
  readonly search = signal('');

  readonly columnasDatos = computed(() => this.columnsFrom(this.estructura()?.mapeo || this.estructura()?.campos || []));
  readonly columnasArchivos = computed(() => this.columnsFrom(this.estructura()?.mapeo_archivos || this.estructura()?.campos || []));

  readonly datosFiltrados = computed(() => this.filterRows(this.datos()));
  readonly docsFiltrados = computed(() => this.filterRows(this.datosArchivo()));

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: ObservatoriosReadService,
    private readonly state: NavigationStateService
  ) { }

  ngOnInit(): void {
    const stored = this.state.estructura();
    const estructuraId = this.route.snapshot.paramMap.get('estructura_id');
    if (stored && String(stored.id) === String(estructuraId)) {
      this.estructura.set(stored);
      this.cargarTodo();
      return;
    }

    if (!estructuraId) return;
    this.loading.set(true);
    this.service.obtenerEstructura(estructuraId).subscribe({
      next: (data) => { this.estructura.set(data); this.state.setEstructura(data); this.loading.set(false); this.cargarTodo(); },
      error: () => { this.error.set('No fue posible cargar la estructura seleccionada.'); this.loading.set(false); }
    });
  }

  cargarTodo(): void {
    this.cargarDatos();
    this.cargarDocumentos();
    this.cargarPaneles();
  }

  cargarDatos(): void {
    const id = this.estructura()?.id;
    if (!id) return;
    this.loading.set(true);
    this.service.listarDatos(id, { page: this.page + 1, page_size: this.pageSize }).subscribe({
      next: (response) => { this.datos.set((response.results || []).filter((item) => item['activo'] !== false)); this.total = Number(response.count || 0); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  cargarDocumentos(): void {
    const estructura = this.estructura();
    const id = estructura?.id_archivos || estructura?.id;
    if (!id) return;
    this.loadingDocs.set(true);
    this.service.listarDatosArchivo(id, { page: this.docsPage + 1, page_size: this.docsPageSize }).subscribe({
      next: (response) => { this.datosArchivo.set((response.results || []).filter((item) => item['activo'] !== false)); this.docsTotal = Number(response.count || 0); this.loadingDocs.set(false); },
      error: () => { this.loadingDocs.set(false); }
    });
  }

  cargarPaneles(): void {
    const observatorio = this.estructura()?.factor || this.route.snapshot.paramMap.get('factor_id');
    this.loadingPaneles.set(true);
    this.service.listarDashboards(observatorio).subscribe({
      next: (paneles) => {
        this.paneles.set(paneles);
        this.loadingPaneles.set(false);
        for (const panel of paneles) {
          if (panel.id) this.cargarGraficos(panel.id);
        }
      },
      error: () => { this.loadingPaneles.set(false); }
    });
  }

  cargarGraficos(panelId: string | number): void {
    this.service.listarGraficos(panelId).subscribe({
      next: (graficos) => this.graficosPorPanel.update((actual) => ({ ...actual, [String(panelId)]: graficos })),
      error: () => this.graficosPorPanel.update((actual) => ({ ...actual, [String(panelId)]: [] }))
    });
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarDatos();
  }

  cambiarPaginaDocs(event: PageEvent): void {
    this.docsPage = event.pageIndex;
    this.docsPageSize = event.pageSize;
    this.cargarDocumentos();
  }

  abrirDocumento(row: Record<string, unknown>): void {
    const hash = String(row['Enlace'] || row['enlace'] || row['Hash'] || row['hash'] || row['id_archivo'] || '');
    if (!hash) {
      alert('Este registro no tiene archivo asociado.');
      return;
    }

    this.service.obtenerDocumento(hash).subscribe({
      next: (response) => {
        if (!response.file) { alert('El gestor documental no retornó archivo.'); return; }
        const blob = this.base64ToBlob(response.file, 'application/pdf');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      },
      error: () => alert('No fue posible abrir el archivo.')
    });
  }

  graficos(panelId: string | number | null | undefined): Grafico[] { return this.graficosPorPanel()[String(panelId ?? '')] || []; }

  volver(): void {
    const procesoId = this.route.snapshot.paramMap.get('proceso_id');
    const factorId = this.route.snapshot.paramMap.get('factor_id');
    void this.router.navigate(['/procesos', procesoId, 'factores', factorId, 'estructuras']);
  }

  private columnsFrom(campos: { nombre?: string }[]): string[] {
    return (campos || []).map((campo) => campo.nombre || '').filter((name) => Boolean(name) && name.toLowerCase() !== 'hash');
  }

  private filterRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    const query = this.search().trim().toLowerCase();
    if (!query) {return rows;}
    return rows.filter((row) =>Object.values(row).some((value) =>String(value ?? '').toLowerCase().includes(query)));
  }

  private base64ToBlob(base64: string, type: string): Blob {
    const bytes = atob(base64);
    const array = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) array[i] = bytes.charCodeAt(i);
    return new Blob([array], { type });
  }
}
