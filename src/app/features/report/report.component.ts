import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { DatePreset, DatePresetKey } from '../../core/models/date-preset.model';
import { DailySalesSummary, LowStockProduct, MonthlySalesSummary, PaymentMethodSummary, TopProduct } from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

type ReportTabKey = 'summary' | 'topProducts' | 'paymentMethods' | 'dailySales' | 'lowStock';

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
    { key: 'dailySales' as ReportTabKey, label: 'Daily Sales' },
    { key: 'lowStock' as ReportTabKey, label: 'Low Stock' }
  ];

  readonly monthlySalesSummary = signal<MonthlySalesSummary[]>([]);
  readonly topProducts = signal<TopProduct[]>([]);
  readonly paymentMethodSummary = signal<PaymentMethodSummary[]>([]);
  readonly dailySalesSummary = signal<DailySalesSummary[]>([]);
  readonly lowStockProducts = signal<LowStockProduct[]>([]);

  readonly isLoading = signal(false);
  readonly isDownloading = signal(false);

  readonly errorMessage = signal('');
  readonly exportErrorMessage = signal('');

  readonly selectedPreset = signal<DatePresetKey | null>('last30Days');
  readonly activeReportTab = signal<ReportTabKey>('summary');

  readonly activeReportTabLabel = computed(
    () => this.reportTabs.find(tab => tab.key === this.activeReportTab())?.label ?? ''
  );

  readonly showDateFilters = computed(() => {
    const tab = this.activeReportTab();

    return tab === 'topProducts' || tab === 'paymentMethods' || tab === 'dailySales';
  });

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
    switch (this.activeReportTab()) {
      case 'summary':
        this.#loadMonthlySalesSummary();
        break;

      case 'topProducts': {
        const dateRange = this.#getValidatedDateRange();

        if (dateRange === null) {
          return;
        }

        this.#loadTopProducts(dateRange.startDate, dateRange.endDate);
        break;
      }

      case 'paymentMethods': {
        const dateRange = this.#getValidatedDateRange();

        if (dateRange === null) {
          return;
        }

        this.#loadPaymentMethodSummary(dateRange.startDate, dateRange.endDate);
        break;
      }

      case 'dailySales': {
        const dateRange = this.#getValidatedDateRange();

        if (dateRange === null) {
          return;
        }

        this.#loadDailySalesSummary(dateRange.startDate, dateRange.endDate);
        break;
      }

      case 'lowStock':
        this.#loadLowStockProducts();
        break;
    }
  }

  applyPreset(preset: DatePresetKey): void {
    const range = this.#getPresetRange(preset);

    this.form.patchValue(range);
    this.selectedPreset.set(preset);
    this.generateReport();
  }

  selectReportTab(tabKey: ReportTabKey): void {
    this.activeReportTab.set(tabKey);
    this.errorMessage.set('');
    this.exportErrorMessage.set('');
    this.generateReport();
  }

  downloadExcel(): void {
    const reportType = this.activeReportTab();
    const reportFileNamePart = this.#getReportFileNamePart(reportType);

    if (this.showDateFilters()) {
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

      this.#downloadExcelFile(
        this.#reportService.exportToExcel(reportType, startDate!, endDate!),
        `${reportFileNamePart}-report_${startDate}_to_${endDate}.xlsx`
      );

      return;
    }

    this.#downloadExcelFile(
      this.#reportService.exportToExcel(reportType),
      `${reportFileNamePart}-report.xlsx`
    );
  }

  #loadMonthlySalesSummary(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.monthlySalesSummary.set([]);

    const subscription = this.#reportService.getMonthlySalesSummary().subscribe({
      next: monthlySalesSummary => {
        this.monthlySalesSummary.set(monthlySalesSummary);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to generate report.'));
        this.monthlySalesSummary.set([]);
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  #loadLowStockProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.lowStockProducts.set([]);

    const subscription = this.#reportService.getLowStockProducts().subscribe({
      next: lowStockProducts => {
        this.lowStockProducts.set(lowStockProducts);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to generate report.'));
        this.lowStockProducts.set([]);
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }


  #loadTopProducts(startDate: string, endDate: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.topProducts.set([]);

    const subscription = this.#reportService.getTopProducts(startDate, endDate, 5).subscribe({
      next: topProducts => {
        this.topProducts.set(topProducts);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to generate report.'));
        this.topProducts.set([]);
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  #loadPaymentMethodSummary(startDate: string, endDate: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.paymentMethodSummary.set([]);

    const subscription = this.#reportService.getPaymentMethodSummary(startDate, endDate).subscribe({
      next: paymentMethodSummary => {
        this.paymentMethodSummary.set(paymentMethodSummary);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to generate report.'));
        this.paymentMethodSummary.set([]);
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  #loadDailySalesSummary(startDate: string, endDate: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.dailySalesSummary.set([]);

    const subscription = this.#reportService.getDailySalesSummary(startDate, endDate).subscribe({
      next: dailySalesSummary => {
        this.dailySalesSummary.set(dailySalesSummary);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to generate report.'));
        this.dailySalesSummary.set([]);
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  #getValidatedDateRange(): { startDate: string; endDate: string } | null {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please select a valid start and end date.');

      return null;
    }

    const { startDate, endDate } = this.form.getRawValue();

    if (startDate! > endDate!) {
      this.errorMessage.set('Start date must be before or equal to end date.');

      return null;
    }

    return { startDate: startDate!, endDate: endDate! };
  }

  #downloadExcelFile(request: Observable<Blob>, fileName: string): void {
    this.isDownloading.set(true);
    this.exportErrorMessage.set('');

    const subscription = request.subscribe({
      next: blob => {
        this.#saveFile(blob, fileName);
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

      case 'lowStock':
        return 'low-stock';

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
