import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateSaleRequest, Sale } from '../models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Sales`;

  getAll(): Observable<Sale[]> {
    return this.#http.get<Sale[]>(this.#baseUrl);
  }

  getById(id: number): Observable<Sale> {
    return this.#http.get<Sale>(`${this.#baseUrl}/${id}`);
  }

  create(request: CreateSaleRequest): Observable<string> {
    return this.#http.post<string>(this.#baseUrl, request);
  }

  calculateTotal(id: number): Observable<{ saleId: number; total: number }> {
    return this.#http.get<{ saleId: number; total: number }>(`${this.#baseUrl}/${id}/total`);
  }
}
