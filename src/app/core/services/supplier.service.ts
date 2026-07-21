import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateSupplierRequest, Supplier } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Suppliers`;

  getAll(): Observable<Supplier[]> {
    return this.#http.get<Supplier[]>(this.#baseUrl);
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
