import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';

import { SalesSummary, TopProduct } from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [DecimalPipe, PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss'
})
export class ReportComponent implements OnDestroy {
  readonly #formBuilder = inject(FormBuilder);
  readonly #reportService = inject(ReportService);
  readonly #subscriptions = new Subscription();

  readonly summary = signal<SalesSummary | null>(null);
  readonly topProducts = signal<TopProduct[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  form = this.#formBuilder.group({
    startDate: [this.#defaultStartDate(), [Validators.required]],
    endDate: [this.#defaultEndDate(), [Validators.required]]
  });

  constructor() {
    this.generateReport();
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
  }

  generateReport(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const { startDate, endDate } = this.form.getRawValue();

    this.isLoading.set(true);
    this.errorMessage.set('');

    const subscription = forkJoin({
      summary: this.#reportService.getSalesSummary(startDate!, endDate!),
      topProducts: this.#reportService.getTopProducts(startDate!, endDate!, 5)
    }).subscribe({
      next: ({ summary, topProducts }) => {
        this.summary.set(summary);
        this.topProducts.set(topProducts);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to generate report.'));
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  #defaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);

    return date.toISOString().slice(0, 10);
  }

  #defaultEndDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  #getErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    return error.error?.Message ?? error.error?.message ?? defaultMessage;
  }
}
