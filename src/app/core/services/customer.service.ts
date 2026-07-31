import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateCustomerRequest, Customer } from '../models/customer.model';
import { PagedResult } from '../models/paged-result.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Customers`;

  getAll(): Observable<Customer[]> {
    return this.#http.get<Customer[]>(this.#baseUrl);
  }

  getPaged(pageNumber: number, pageSize: number): Observable<PagedResult<Customer>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.#http.get<PagedResult<Customer>>(`${this.#baseUrl}/paged`, { params });
  }

  getById(id: number): Observable<Customer> {
    return this.#http.get<Customer>(`${this.#baseUrl}/${id}`);
  }

  create(request: CreateCustomerRequest): Observable<string> {
    return this.#http.post<string>(this.#baseUrl, request);
  }

  update(id: number, request: CreateCustomerRequest): Observable<string> {
    return this.#http.put<string>(`${this.#baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<string> {
    return this.#http.delete<string>(`${this.#baseUrl}/${id}`);
  }
}
