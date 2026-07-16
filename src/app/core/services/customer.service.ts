import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateCustomerRequest, Customer } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Customers`;

  getAll(): Observable<Customer[]> {
    return this.#http.get<Customer[]>(this.#baseUrl);
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
