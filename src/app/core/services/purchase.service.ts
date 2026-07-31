import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';
import { CreatePurchaseRequest, Purchase } from '../models/purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Purchases`;

  getAll(): Observable<Purchase[]> {
    return this.#http.get<Purchase[]>(this.#baseUrl);
  }

  getPaged(pageNumber: number, pageSize: number): Observable<PagedResult<Purchase>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.#http.get<PagedResult<Purchase>>(`${this.#baseUrl}/paged`, { params });
  }

  getById(id: number): Observable<Purchase> {
    return this.#http.get<Purchase>(`${this.#baseUrl}/${id}`);
  }

  create(request: CreatePurchaseRequest): Observable<{ message: string }> {
    return this.#http.post<{ message: string }>(this.#baseUrl, request);
  }
}
