import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { ApiClientService } from './api-client.service';
import {
  Aspecto,
  Caracteristica,
  Dashboard,
  EstructuraEvidencia,
  Factor,
  Grafico,
  PaginatedResponse,
  Proceso,
  RegistroEstructura
} from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class ObservatoriosReadService {
  constructor(private readonly api: ApiClientService) {}

  listarProcesos(): Observable<Proceso[]> {
    return this.api.get<Proceso[]>('/procesos/').pipe(map((items) => this.onlyActive(items)));
  }

  obtenerProceso(id: string | number): Observable<Proceso> {
    return this.api.get<Proceso>(`/procesos/${id}/`);
  }

  obtenerProcesoActivo(): Observable<Proceso | null> {
    return this.listarProcesos().pipe(
      map((procesos) => procesos[0] ?? null)
    );
  }

  listarFactores(): Observable<Factor[]> {
    return this.api.get<Factor[]>('/factores/').pipe(map((items) => this.onlyActive(items)));
  }

  obtenerFactor(id: string | number): Observable<Factor> {
    return this.api.get<Factor>(`/factores/${id}/`);
  }

  listarFactoresPorProceso(procesoId: string | number): Observable<Factor[]> {
    return this.listarFactores().pipe(
      map((items) =>
        items.filter((item) => String(item.proceso_id ?? '') === String(procesoId))
      )
    );
  }

  listarCaracteristicasPorFactor(factorId: string | number): Observable<Caracteristica[]> {
    return this.api.get<Caracteristica[]>('/caracteristicas/', { factor_id: factorId }).pipe(map((items) => this.onlyActive(items)));
  }

  listarAspectosPorCaracteristica(caracteristicaId: string | number): Observable<Aspecto[]> {
    return this.api.get<Aspecto[]>('/aspectos/', { caracteristica_id: caracteristicaId }).pipe(map((items) => this.onlyActive(items)));
  }

  listarEstructurasPorAspecto(aspectoId: string | number): Observable<EstructuraEvidencia[]> {
    return this.api.get<EstructuraEvidencia[]>('/estructuras-evidencias/', { aspecto_id: aspectoId }).pipe(map((items) => this.onlyActive(items)));
  }

  listarEstructurasPorFactor(factorId: string | number, nombreFactor = ''): Observable<EstructuraEvidencia[]> {
    return this.listarCaracteristicasPorFactor(factorId).pipe(
      switchMap((caracteristicas) => {
        if (caracteristicas.length === 0) return of([]);
        return forkJoin(caracteristicas.map((caracteristica) =>
          this.listarAspectosPorCaracteristica(caracteristica.id ?? '').pipe(
            switchMap((aspectos) => {
              if (aspectos.length === 0) return of([]);
              return forkJoin(aspectos.map((aspecto) =>
                this.listarEstructurasPorAspecto(aspecto.id ?? '').pipe(
                  map((estructuras) => estructuras.map((estructura) => ({
                    ...estructura,
                    factor: factorId,
                    nombreFactor,
                    nombreCaracteristica: caracteristica.nombre || '',
                    aspectoNombre: aspecto.nombre || '',
                    tieneDatos: (estructura.tipo_evidencia || '').toLowerCase() === 'tabla',
                    tieneArchivos: (estructura.tipo_evidencia || '').toLowerCase() === 'documental'
                  })))
                )
              )).pipe(map((grupos) => grupos.flat()));
            })
          )
        )).pipe(map((grupos) => grupos.flat()));
      })
    );
  }

  obtenerEstructura(id: string | number): Observable<EstructuraEvidencia> {
    return this.api.get<EstructuraEvidencia>(`/estructuras/${id}`);
  }

  listarDatos(
    idEstructura: string | number,
    params: Record<string, unknown>
  ): Observable<PaginatedResponse<Record<string, unknown>>> {
    return this.api.get<PaginatedResponse<Record<string, unknown>>>(
      `/datos/${idEstructura}/`,
      params
    );
  }

  listarDatosArchivo(
    idEstructura: string | number,
    params: Record<string, unknown>
  ): Observable<PaginatedResponse<Record<string, unknown>>> {
    return this.api.get<PaginatedResponse<Record<string, unknown>>>(
      `/datosArchivo/${idEstructura}/`,
      params
    );
  }

  listarDatosEstructura(estructuraId: string | number,params: Record<string, unknown>): Observable<PaginatedResponse<RegistroEstructura>> {
    return this.api.get<PaginatedResponse<RegistroEstructura>>(`/estructuras/${estructuraId}/datos`,params);
  }

  listarDashboards(observatorio?: string | number | null): Observable<Dashboard[]> {
    return this.api.get<Dashboard[]>('/dashboards/', observatorio ? { observatorio } : undefined).pipe(map((items) => this.onlyActive(items)));
  }

  listarGraficos(panelId: string | number): Observable<Grafico[]> {
    return this.api.get<Grafico[]>(`/graficos/${panelId}/`).pipe(map((items) => this.onlyActive(items)));
  }

  construirGrafico(panelId: string | number, graficoId: string | number): Observable<Record<string, unknown>> {
    return this.api.get<Record<string, unknown>>(`/graficos/${panelId}/${graficoId}/construir/`);
  }

  obtenerDocumento(hash: string): Observable<{ file?: string }> {
    return this.api.get<{ file?: string }>(`document/${hash}`, undefined, 'GESTOR_DOCUMENTAL');
  }

  private onlyActive<T extends { activo?: boolean }>(items: T[] | null | undefined): T[] {
    return Array.isArray(items) ? items.filter((item) => item.activo !== false) : [];
  }
}
