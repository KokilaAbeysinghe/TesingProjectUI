import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DailySalesSummary, LowStockProduct, MonthlySalesSummary, PaymentMethodSummary, TopProduct } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = `${environment.apiUrl}/api/Reports`;

  getMonthlySalesSummary(startDate: string, endDate: string): Observable<MonthlySalesSummary[]> {
    return this.#http.get<MonthlySalesSummary[]>(`${this.#baseUrl}/monthly-sales`, {
      params: { startDate, endDate }
    });
  }

  getTopProducts(startDate: string, endDate: string, count: number): Observable<TopProduct[]> {
    return this.#http.get<TopProduct[]>(`${this.#baseUrl}/top-products`, {
      params: { startDate, endDate, count: count.toString() }
    });
  }

  getPaymentMethodSummary(startDate: string, endDate: string): Observable<PaymentMethodSummary[]> {
    return this.#http.get<PaymentMethodSummary[]>(`${this.#baseUrl}/payment-methods`, {
      params: { startDate, endDate }
    });
  }

  getDailySalesSummary(startDate: string, endDate: string): Observable<DailySalesSummary[]> {
    return this.#http.get<DailySalesSummary[]>(`${this.#baseUrl}/daily-sales`, {
      params: { startDate, endDate }
    });
  }

  getLowStockProducts(): Observable<LowStockProduct[]> {
    return this.#http.get<LowStockProduct[]>(`${this.#baseUrl}/low-stock`);
  }

  exportToExcel(startDate: string, endDate: string, reportType: string): Observable<Blob> {
    return this.#http.get(`${this.#baseUrl}/export/excel`, {
      params: { startDate, endDate, reportType },
      responseType: 'blob'
    });
  }
}
