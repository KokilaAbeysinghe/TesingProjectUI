import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Subscription, debounceTime } from 'rxjs';

import { Product, StockAdjustmentType } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [PageHeaderComponent, PaginationComponent, ReactiveFormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnDestroy {
  readonly #authService = inject(AuthService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #productService = inject(ProductService);
  readonly #subscriptions = new Subscription();
  readonly #searchChange = new Subject<void>();

  readonly #lowStockThreshold = 10;
  readonly #pageSize = 10;

  readonly adjustmentTypes: StockAdjustmentType[] = ['Add', 'Remove'];

  readonly products = signal<Product[]>([]);
  readonly tableProducts = signal<Product[]>([]);
  readonly productSearch = signal('');
  readonly showLowStockOnly = signal(false);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  form = this.#formBuilder.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    adjustmentType: ['Add' as StockAdjustmentType, [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  constructor() {
    this.loadAllProducts();
    this.loadTableProducts();

    const searchSubscription = this.#searchChange.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(1);
      this.loadTableProducts();
    });

    this.#subscriptions.add(searchSubscription);
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
  }

  get canAdjustStock(): boolean {
    const role = this.#authService.getUserRole();

    return role === 'Admin' || role === 'Manager';
  }

  get selectedProduct(): Product | null {
    const productId = this.form.getRawValue().productId;

    return this.products().find(product => product.id === productId) ?? null;
  }

  get lowStockThreshold(): number {
    return this.#lowStockThreshold;
  }

  loadAllProducts(): void {
    const subscription = this.#productService.getAll().subscribe({
      next: products => this.products.set(products),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load products.'));
      }
    });

    this.#subscriptions.add(subscription);
  }

  loadTableProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const search = this.productSearch().trim() || undefined;
    const maxStock = this.showLowStockOnly() ? this.#lowStockThreshold : undefined;

    const subscription = this.#productService.getPaged(this.currentPage(), this.#pageSize, search, maxStock).subscribe({
      next: result => {
        this.tableProducts.set(result.items);
        this.totalPages.set(Math.max(1, result.totalPages));
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load inventory.'));
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  updateProductSearch(value: string): void {
    this.productSearch.set(value);
    this.#searchChange.next();
  }

  updateShowLowStockOnly(checked: boolean): void {
    this.showLowStockOnly.set(checked);
    this.currentPage.set(1);
    this.loadTableProducts();
  }

  updateCurrentPage(page: number): void {
    this.currentPage.set(page);
    this.loadTableProducts();
  }

  selectProduct(product: Product): void {
    this.form.patchValue({ productId: product.id });
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  submit(): void {
    if (!this.canAdjustStock) {
      this.errorMessage.set('Only Admin or Manager can adjust stock.');

      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { productId, adjustmentType, quantity } = this.form.getRawValue();

    const subscription = this.#productService.adjustStock(productId!, {
      quantity: Number(quantity),
      adjustmentType: adjustmentType!
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set('Stock adjusted successfully.');
        this.form.patchValue({ quantity: 1, adjustmentType: 'Add' });
        this.loadAllProducts();
        this.loadTableProducts();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to adjust stock.'));
        this.isSaving.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  #getErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    return error.error?.Message ?? error.error?.message ?? defaultMessage;
  }
}
