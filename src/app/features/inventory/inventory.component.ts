import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Product, StockAdjustmentType } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnDestroy {
  readonly #authService = inject(AuthService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #productService = inject(ProductService);
  readonly #subscriptions = new Subscription();

  readonly adjustmentTypes: StockAdjustmentType[] = ['Add', 'Remove'];

  readonly products = signal<Product[]>([]);
  readonly productSearch = signal('');
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly filteredProducts = computed(() => {
    const search = this.productSearch().trim().toLowerCase();
    const products = this.products();

    if (!search) {
      return products;
    }

    return products.filter(product =>
      product.name.toLowerCase().includes(search)
      || product.categoryName.toLowerCase().includes(search)
    );
  });

  form = this.#formBuilder.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    adjustmentType: ['Add' as StockAdjustmentType, [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  constructor() {
    this.loadProducts();
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

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const subscription = this.#productService.getAll().subscribe({
      next: products => {
        this.products.set(products);
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
        this.loadProducts();
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
