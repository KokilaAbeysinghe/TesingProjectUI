import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreatePurchaseRequest, Purchase } from '../models/purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Purchases`;

  getAll(): Observable<Purchase[]> {
    return this.#http.get<Purchase[]>(this.#baseUrl);
  }

  getById(id: number): Observable<Purchase> {
    return this.#http.get<Purchase>(`${this.#baseUrl}/${id}`);
  }

  create(request: CreatePurchaseRequest): Observable<{ message: string }> {
    return this.#http.post<{ message: string }>(this.#baseUrl, request);
  }
}
