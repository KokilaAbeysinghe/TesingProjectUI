import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';
import { CreateSupplierRequest, Supplier } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Suppliers`;

  getAll(): Observable<Supplier[]> {
    return this.#http.get<Supplier[]>(this.#baseUrl);
  }

  getPaged(pageNumber: number, pageSize: number, search?: string): Observable<PagedResult<Supplier>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (search) {
      params = params.set('search', search);
    }

    return this.#http.get<PagedResult<Supplier>>(`${this.#baseUrl}/paged`, { params });
  }

  getById(id: number): Observable<Supplier> {
    return this.#http.get<Supplier>(`${this.#baseUrl}/${id}`);
  }

  create(request: CreateSupplierRequest): Observable<{ message: string }> {
    return this.#http.post<{ message: string }>(this.#baseUrl, request);
  }

  update(id: number, request: CreateSupplierRequest): Observable<{ message: string }> {
    return this.#http.put<{ message: string }>(`${this.#baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.#http.delete<{ message: string }>(`${this.#baseUrl}/${id}`);
  }
}
