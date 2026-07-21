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
  readonly isDownloading = signal(false);

  readonly errorMessage = signal('');
  readonly exportErrorMessage = signal('');

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
      this.errorMessage.set('Please select a valid start and end date.');

      return;
    }

    const { startDate, endDate } = this.form.getRawValue();

    if (startDate! > endDate!) {
      this.errorMessage.set('Start date must be before or equal to end date.');

      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.summary.set(null);
    this.topProducts.set([]);

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
        this.summary.set(null);
        this.topProducts.set([]);
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  downloadExcel(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.exportErrorMessage.set('Please select a valid start and end date.');

      return;
    }

    const { startDate, endDate } = this.form.getRawValue();

    if (startDate! > endDate!) {
      this.exportErrorMessage.set('Start date must be before or equal to end date.');

      return;
    }

    this.isDownloading.set(true);
    this.exportErrorMessage.set('');

    const subscription = this.#reportService.exportToExcel(startDate!, endDate!).subscribe({
      next: blob => {
        this.#saveFile(blob, `sales-report_${startDate}_to_${endDate}.xlsx`);
        this.isDownloading.set(false);
      },
      error: () => {
        this.exportErrorMessage.set('Failed to download the Excel report.');
        this.isDownloading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  #saveFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  #defaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);

    return this.#toLocalDateValue(date);
  }

  #defaultEndDate(): string {
    return this.#toLocalDateValue(new Date());
  }

  #toLocalDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  #getErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    return error.error?.Message ?? error.error?.message ?? defaultMessage;
  }
}
