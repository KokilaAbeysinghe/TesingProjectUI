import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';
import { CreateUserRequest, UpdateUserRequest, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Users`;

  getAll(): Observable<User[]> {
    return this.#http.get<User[]>(this.#baseUrl);
  }

  getPaged(pageNumber: number, pageSize: number): Observable<PagedResult<User>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.#http.get<PagedResult<User>>(`${this.#baseUrl}/paged`, { params });
  }

  getById(id: number): Observable<User> {
    return this.#http.get<User>(`${this.#baseUrl}/${id}`);
  }

  create(request: CreateUserRequest): Observable<{ message: string }> {
    return this.#http.post<{ message: string }>(this.#baseUrl, request);
  }

  update(id: number, request: UpdateUserRequest): Observable<{ message: string }> {
    return this.#http.put<{ message: string }>(`${this.#baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.#http.delete<{ message: string }>(`${this.#baseUrl}/${id}`);
  }
}
