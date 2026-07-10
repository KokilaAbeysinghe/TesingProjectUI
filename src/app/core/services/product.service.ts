import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateProductRequest, Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Products`;

  getAll(): Observable<Product[]> {
    return this.#http.get<Product[]>(this.#baseUrl);
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

  delete(id: number): Observable<string> {
    return this.#http.delete<string>(`${this.#baseUrl}/${id}`);
  }
}
