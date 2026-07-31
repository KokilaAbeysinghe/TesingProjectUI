import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';

import { Product } from '../../core/models/product.model';
import { Purchase } from '../../core/models/purchase.model';
import { Supplier } from '../../core/models/supplier.model';
import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { PurchaseService } from '../../core/services/purchase.service';
import { SupplierService } from '../../core/services/supplier.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

interface CartItem {
  productId: number;
  productName: string;
  unitCost: number;
  quantity: number;
}

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [DatePipe, DecimalPipe, PageHeaderComponent, PaginationComponent, ReactiveFormsModule],
  templateUrl: './purchase.component.html',
  styleUrl: './purchase.component.scss'
})
export class PurchaseComponent implements OnDestroy {
  readonly #authService = inject(AuthService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #productService = inject(ProductService);
  readonly #purchaseService = inject(PurchaseService);
  readonly #subscriptions = new Subscription();
  readonly #supplierService = inject(SupplierService);
  readonly #pageSize = 10;

  readonly suppliers = signal<Supplier[]>([]);
  readonly products = signal<Product[]>([]);
  readonly purchases = signal<Purchase[]>([]);
  readonly cartItems = signal<CartItem[]>([]);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly itemErrorMessage = signal('');
  readonly expandedPurchaseId = signal<number | null>(null);

  purchaseForm = this.#formBuilder.group({
    supplierId: [0, [Validators.required, Validators.min(1)]]
  });

  itemForm = this.#formBuilder.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitCost: [0, [Validators.required, Validators.min(0.01)]]
  });

  constructor() {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
  }

  get canCreatePurchase(): boolean {
    const role = this.#authService.getUserRole();

    return role === 'Admin' || role === 'Manager';
  }

  get cartTotal(): number {
    return this.cartItems().reduce((total, item) => total + item.unitCost * item.quantity, 0);
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.currentPage.set(1);

    const subscription = forkJoin({
      suppliers: this.#supplierService.getAll(),
      products: this.#productService.getAll(),
      purchases: this.#purchaseService.getPaged(this.currentPage(), this.#pageSize)
    }).subscribe({
      next: ({ suppliers, products, purchases }) => {
        this.suppliers.set(suppliers);
        this.products.set(products);
        this.purchases.set(purchases.items);
        this.totalPages.set(Math.max(1, purchases.totalPages));
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load purchase data.'));
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  loadPurchases(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const subscription = this.#purchaseService.getPaged(this.currentPage(), this.#pageSize).subscribe({
      next: result => {
        this.purchases.set(result.items);
        this.totalPages.set(Math.max(1, result.totalPages));
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load purchases.'));
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  addItemToCart(): void {
    this.itemErrorMessage.set('');

    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();

      return;
    }

    const { productId, quantity, unitCost } = this.itemForm.getRawValue();
    const product = this.products().find(item => item.id === productId);

    if (!product) {
      this.itemErrorMessage.set('Select a valid product.');

      return;
    }

    const existingItem = this.cartItems().find(item => item.productId === productId);

    if (existingItem) {
      this.cartItems.update(items => items.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + quantity!, unitCost: unitCost! }
          : item
      ));
    } else {
      this.cartItems.update(items => [...items, {
        productId: product.id,
        productName: product.name,
        unitCost: unitCost!,
        quantity: quantity!
      }]);
    }

    this.itemForm.reset({ productId: 0, quantity: 1, unitCost: 0 });
  }

  removeFromCart(productId: number): void {
    this.cartItems.update(items => items.filter(item => item.productId !== productId));
  }

  submitPurchase(): void {
    this.purchaseForm.markAllAsTouched();

    if (!this.canCreatePurchase || this.purchaseForm.invalid || this.cartItems().length === 0) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const { supplierId } = this.purchaseForm.getRawValue();
    const request = {
      supplierId: supplierId!,
      purchaseItems: this.cartItems().map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost
      }))
    };

    const subscription = this.#purchaseService.create(request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cartItems.set([]);
        this.purchaseForm.reset({ supplierId: 0 });
        this.loadData();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to record purchase.'));
        this.isSaving.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  togglePurchaseDetails(purchaseId: number): void {
    this.expandedPurchaseId.set(this.expandedPurchaseId() === purchaseId ? null : purchaseId);
  }

  updateCurrentPage(page: number): void {
    this.currentPage.set(page);
    this.loadPurchases();
  }

  #getErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    return error.error?.Message ?? error.error?.message ?? defaultMessage;
  }
}
