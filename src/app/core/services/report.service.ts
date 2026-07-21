import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SalesSummary, TopProduct } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Reports`;

  getSalesSummary(startDate: string, endDate: string): Observable<SalesSummary> {
    return this.#http.get<SalesSummary>(`${this.#baseUrl}/summary`, { params: { startDate, endDate } });
  }

  getTopProducts(startDate: string, endDate: string, count: number): Observable<TopProduct[]> {
    return this.#http.get<TopProduct[]>(`${this.#baseUrl}/top-products`, {
      params: { startDate, endDate, count: count.toString() }
    });
  }

  exportToExcel(startDate: string, endDate: string): Observable<Blob> {
    return this.#http.get(`${this.#baseUrl}/export/excel`, {
      params: { startDate, endDate },
      responseType: 'blob'
    });
  }
}
