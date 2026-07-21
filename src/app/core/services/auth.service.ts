import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Auth`;
  readonly #tokenKey = 'pos_access_token';
  readonly #userKey = 'pos_user';

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.#http.post<AuthResponse>(`${this.#baseUrl}/login`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.#http.post<AuthResponse>(`${this.#baseUrl}/register`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  saveSession(response: AuthResponse): void {
    localStorage.setItem(this.#tokenKey, response.accessToken);
    localStorage.setItem(this.#userKey, JSON.stringify({
      userId: response.userId,
      email: response.email,
      role: response.role,
      expiresAtUtc: response.expiresAtUtc
    }));
  }

  getToken(): string | null {
    return localStorage.getItem(this.#tokenKey);
  }

  getUserEmail(): string | null {
    const user = localStorage.getItem(this.#userKey);

    return user ? JSON.parse(user).email : null;
  }

  getUserRole(): string | null {
    const user = localStorage.getItem(this.#userKey);

    return user ? JSON.parse(user).role : null;
  }

  getUserId(): number | null {
    const user = localStorage.getItem(this.#userKey);

    return user ? JSON.parse(user).userId : null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    const user = localStorage.getItem(this.#userKey);
    if (!user) {
      return false;
    }
    const expiresAtUtc = new Date(JSON.parse(user).expiresAtUtc);

    return expiresAtUtc > new Date();
  }

  logout(): void {
    localStorage.removeItem(this.#tokenKey);
    localStorage.removeItem(this.#userKey);
  }
}