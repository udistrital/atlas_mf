import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type ApiTarget = 'MAIN_BACKEND' | 'GESTOR_DOCUMENTAL';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  constructor(private readonly http: HttpClient) {}

  get<T>(endpoint: string, params?: Record<string, unknown>, target: ApiTarget = 'MAIN_BACKEND'): Observable<T> {
    const url = this.buildUrl(endpoint, target);
    return this.http.get<T>(url, {params: this.buildParams(params), withCredentials: target === 'MAIN_BACKEND'});
  }

  private buildUrl(endpoint: string, target: ApiTarget): string {
    const base = environment[target].replace(/\/$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }

  private buildParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') continue;
      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }
}
