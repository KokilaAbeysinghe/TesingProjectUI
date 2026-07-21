import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateUserRequest, UpdateUserRequest, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Users`;

  getAll(): Observable<User[]> {
    return this.#http.get<User[]>(this.#baseUrl);
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
