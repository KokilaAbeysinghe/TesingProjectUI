import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';
import { CreateProductCategoryRequest, ProductCategory } from '../models/product-category.model';

@Injectable({ providedIn: 'root' })
export class ProductCategoryService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/ProductCategories`;

  getAll(): Observable<ProductCategory[]> {
    return this.#http.get<ProductCategory[]>(this.#baseUrl);
  }

  getPaged(pageNumber: number, pageSize: number): Observable<PagedResult<ProductCategory>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.#http.get<PagedResult<ProductCategory>>(`${this.#baseUrl}/paged`, { params });
  }

  getById(id: number): Observable<ProductCategory> {
    return this.#http.get<ProductCategory>(`${this.#baseUrl}/${id}`);
  }

  create(request: CreateProductCategoryRequest): Observable<string> {
    return this.#http.post<string>(this.#baseUrl, request);
  }

  update(id: number, request: CreateProductCategoryRequest): Observable<string> {
    return this.#http.put<string>(`${this.#baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<string> {
    return this.#http.delete<string>(`${this.#baseUrl}/${id}`);
  }
}
