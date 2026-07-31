import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';
import { AdjustStockRequest, CreateProductRequest, Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Products`;

  getAll(): Observable<Product[]> {
    return this.#http.get<Product[]>(this.#baseUrl);
  }

  getPaged(pageNumber: number, pageSize: number, search?: string, maxStock?: number): Observable<PagedResult<Product>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (search) {
      params = params.set('search', search);
    }

    if (maxStock !== undefined) {
      params = params.set('maxStock', maxStock);
    }

    return this.#http.get<PagedResult<Product>>(`${this.#baseUrl}/paged`, { params });
  }

  getById(id: number): Observable<Product> {
    return this.#http.get<Product>(`${this.#baseUrl}/${id}`);
  }

  create(request: CreateProductRequest): Observable<string> {
    return this.#http.post<string>(this.#baseUrl, request);
  }

  update(id: number, request: CreateProductRequest): Observable<string> {
    return this.#http.put<string>(`${this.#baseUrl}/${id}`, request);
  }

  adjustStock(id: number, request: AdjustStockRequest): Observable<{ message: string }> {
    return this.#http.post<{ message: string }>(`${this.#baseUrl}/${id}/adjust-stock`, request);
  }

  delete(id: number): Observable<string> {
    return this.#http.delete<string>(`${this.#baseUrl}/${id}`);
  }
  count():Observable<number> {
    return this.#http.get<number>(`${this.#baseUrl}/count`);
  }
}
