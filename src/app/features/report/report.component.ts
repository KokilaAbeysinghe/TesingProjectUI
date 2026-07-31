import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';

import { DatePreset, DatePresetKey } from '../../core/models/date-preset.model';
import { DailySalesSummary, PaymentMethodSummary, SalesSummary, TopProduct } from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

type ReportTabKey = 'summary' | 'topProducts' | 'paymentMethods' | 'dailySales';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [DatePipe, DecimalPipe, PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss'
})
export class ReportComponent implements OnDestroy {
  readonly #formBuilder = inject(FormBuilder);
  readonly #reportService = inject(ReportService);
  readonly #subscriptions = new Subscription();

  readonly datePresets: DatePreset[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7Days', label: 'Last 7 Days' },
    { key: 'last30Days', label: 'Last 30 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' }
  ];

  readonly reportTabs = [
    { key: 'summary' as ReportTabKey, label: 'Summary' },
    { key: 'topProducts' as ReportTabKey, label: 'Top Products' },
    { key: 'paymentMethods' as ReportTabKey, label: 'Payment Methods' },
    { key: 'dailySales' as ReportTabKey, label: 'Daily Sales' }
  ];

  readonly summary = signal<SalesSummary | null>(null);
  readonly topProducts = signal<TopProduct[]>([]);
  readonly paymentMethodSummary = signal<PaymentMethodSummary[]>([]);
  readonly dailySalesSummary = signal<DailySalesSummary[]>([]);

  readonly isLoading = signal(false);
  readonly isDownloading = signal(false);

  readonly errorMessage = signal('');
  readonly exportErrorMessage = signal('');

  readonly selectedPreset = signal<DatePresetKey | null>('last30Days');
  readonly activeReportTab = signal<ReportTabKey>('summary');

  readonly activeReportTabLabel = computed(
    () => this.reportTabs.find(tab => tab.key === this.activeReportTab())?.label ?? ''
  );

  form = this.#formBuilder.group({
    startDate: [this.#defaultStartDate(), [Validators.required]],
    endDate: [this.#defaultEndDate(), [Validators.required]]
  });

  constructor() {
    this.generateReport();

    const formChangeSubscription = this.form.valueChanges.subscribe(() => {
      this.selectedPreset.set(null);
    });

    this.#subscriptions.add(formChangeSubscription);
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
    this.paymentMethodSummary.set([]);
    this.dailySalesSummary.set([]);

    const subscription = forkJoin({
      summary: this.#reportService.getSalesSummary(startDate!, endDate!),
      topProducts: this.#reportService.getTopProducts(startDate!, endDate!, 5),
      paymentMethodSummary: this.#reportService.getPaymentMethodSummary(startDate!, endDate!),
      dailySalesSummary: this.#reportService.getDailySalesSummary(startDate!, endDate!)
    }).subscribe({
      next: ({ summary, topProducts, paymentMethodSummary, dailySalesSummary }) => {
        this.summary.set(summary);
        this.topProducts.set(topProducts);
        this.paymentMethodSummary.set(paymentMethodSummary);
        this.dailySalesSummary.set(dailySalesSummary);
        this.activeReportTab.set('summary');
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to generate report.'));
        this.summary.set(null);
        this.topProducts.set([]);
        this.paymentMethodSummary.set([]);
        this.dailySalesSummary.set([]);
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  applyPreset(preset: DatePresetKey): void {
    const range = this.#getPresetRange(preset);

    this.form.patchValue(range);
    this.selectedPreset.set(preset);
    this.generateReport();
  }

  selectReportTab(tabKey: ReportTabKey): void {
    this.activeReportTab.set(tabKey);
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

    const reportType = this.activeReportTab();
    const reportFileNamePart = this.#getReportFileNamePart(reportType);

    const subscription = this.#reportService.exportToExcel(startDate!, endDate!, reportType).subscribe({
      next: blob => {
        this.#saveFile(blob, `${reportFileNamePart}-report_${startDate}_to_${endDate}.xlsx`);
        this.isDownloading.set(false);
      },
      error: () => {
        this.exportErrorMessage.set('Failed to download the Excel report.');
        this.isDownloading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  #getReportFileNamePart(reportType: ReportTabKey): string {
    switch (reportType) {
      case 'topProducts':
        return 'top-products';

      case 'paymentMethods':
        return 'payment-methods';

      case 'dailySales':
        return 'daily-sales';

      case 'summary':
        return 'summary';
    }
  }

  #saveFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  #getPresetRange(preset: DatePresetKey): { startDate: string; endDate: string } {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    switch (preset) {
      case 'today':
        return { startDate: this.#toLocalDateValue(end), endDate: this.#toLocalDateValue(end) };

      case 'yesterday': {
        const yesterday = new Date(end);
        yesterday.setDate(yesterday.getDate() - 1);

        return { startDate: this.#toLocalDateValue(yesterday), endDate: this.#toLocalDateValue(yesterday) };
      }

      case 'last7Days': {
        const start = new Date(end);
        start.setDate(start.getDate() - 6);

        return { startDate: this.#toLocalDateValue(start), endDate: this.#toLocalDateValue(end) };
      }

      case 'last30Days': {
        const start = new Date(end);
        start.setDate(start.getDate() - 29);

        return { startDate: this.#toLocalDateValue(start), endDate: this.#toLocalDateValue(end) };
      }

      case 'thisMonth': {
        const start = new Date(end.getFullYear(), end.getMonth(), 1);

        return { startDate: this.#toLocalDateValue(start), endDate: this.#toLocalDateValue(end) };
      }

      case 'lastMonth': {
        const start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
        const lastDay = new Date(end.getFullYear(), end.getMonth(), 0);

        return { startDate: this.#toLocalDateValue(start), endDate: this.#toLocalDateValue(lastDay) };
      }
    }
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
