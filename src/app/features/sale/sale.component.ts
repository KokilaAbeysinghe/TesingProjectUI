import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';

import { Customer } from '../../core/models/customer.model';
import { Product } from '../../core/models/product.model';
import { PaymentMethod, Sale } from '../../core/models/sale.model';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { ProductService } from '../../core/services/product.service';
import { SaleService } from '../../core/services/sale.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [DatePipe, DecimalPipe, PageHeaderComponent, PaginationComponent, ReactiveFormsModule],
  templateUrl: './sale.component.html',
  styleUrl: './sale.component.scss'
})
export class SaleComponent implements OnDestroy {
  readonly #authService = inject(AuthService);
  readonly #customerService = inject(CustomerService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #productService = inject(ProductService);
  readonly #saleService = inject(SaleService);
  readonly #subscriptions = new Subscription();
  readonly #clearPrintingSale = (): void => this.printingSale.set(null);
  readonly #pageSize = 5;
  readonly #wholeNumberValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    return value === null || value === undefined || Number.isInteger(Number(value)) ? null : { wholeNumber: true };
  };

  readonly paymentMethods: PaymentMethod[] = ['Cash', 'Card', 'BankTransfer'];

  readonly customers = signal<Customer[]>([]);
  readonly products = signal<Product[]>([]);
  readonly sales = signal<Sale[]>([]);
  readonly cartItems = signal<CartItem[]>([]);
  readonly productSearch = signal('');
  readonly currentPage = signal(1);

  readonly filteredProducts = computed(() => {
    const search = this.productSearch().trim().toLowerCase();
    const products = this.products();

    if (!search) {
      return products;
    }

    return products.filter(product => product.name.toLowerCase().includes(search));
  });

  readonly totalPages = signal(1);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isVoiding = signal(false);
  readonly errorMessage = signal('');
  readonly itemErrorMessage = signal('');
  readonly editErrorMessage = signal('');
  readonly expandedSaleId = signal<number | null>(null);
  readonly editingSale = signal<Sale | null>(null);
  readonly printingSale = signal<Sale | null>(null);

  saleForm = this.#formBuilder.group({
    customerId: [0, [Validators.required, Validators.min(1)]],
    discountPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100), this.#wholeNumberValidator]],
    paymentMethod: ['Cash' as PaymentMethod, [Validators.required]]
  });

  itemForm = this.#formBuilder.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  editForm = this.#formBuilder.group({
    customerId: [0, [Validators.required, Validators.min(1)]],
    discountPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100), this.#wholeNumberValidator]],
    paymentMethod: ['Cash' as PaymentMethod, [Validators.required]]
  });

  constructor() {
    this.loadData();
    window.addEventListener('afterprint', this.#clearPrintingSale);
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
    window.removeEventListener('afterprint', this.#clearPrintingSale);
  }

  get cartTotal(): number {
    return this.cartItems().reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  }

  get discountPercentage(): number {
    return this.saleForm.getRawValue().discountPercentage ?? 0;
  }

  get discountAmount(): number {
    return Math.round(this.cartTotal * this.discountPercentage) / 100;
  }

  get netTotal(): number {
    return Math.max(this.cartTotal - this.discountAmount, 0);
  }

  get editSubtotal(): number {
    const sale = this.editingSale();

    return sale ? sale.saleItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0) : 0;
  }

  get editDiscountPercentage(): number {
    return this.editForm.getRawValue().discountPercentage ?? 0;
  }

  get editDiscountAmount(): number {
    return Math.round(this.editSubtotal * this.editDiscountPercentage) / 100;
  }

  get editNetTotal(): number {
    return Math.max(this.editSubtotal - this.editDiscountAmount, 0);
  }

  get canManageSale(): boolean {
    const role = this.#authService.getUserRole();

    return role === 'Admin' || role === 'Manager';
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.currentPage.set(1);

    const subscription = forkJoin({
      customers: this.#customerService.getAll(),
      products: this.#productService.getAll(),
      sales: this.#saleService.getPaged(this.currentPage(), this.#pageSize)
    }).subscribe({
      next: ({ customers, products, sales }) => {
        this.customers.set(customers);
        this.products.set(products);
        this.sales.set(sales.items);
        this.totalPages.set(Math.max(1, sales.totalPages));
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load sales data.'));
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  loadSales(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const subscription = this.#saleService.getPaged(this.currentPage(), this.#pageSize).subscribe({
      next: result => {
        this.sales.set(result.items);
        this.totalPages.set(Math.max(1, result.totalPages));
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load sales.'));
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

    const { productId, quantity } = this.itemForm.getRawValue();
    const product = this.products().find(p => p.id === productId);

    if (!product) {
      this.itemErrorMessage.set('Select a valid product.');

      return;
    }

    const existingItem = this.cartItems().find(item => item.productId === productId);
    const quantityInCart = (existingItem?.quantity ?? 0) + quantity!;

    if (quantityInCart > product.stock) {
      this.itemErrorMessage.set(`Only ${product.stock} unit(s) of "${product.name}" available.`);

      return;
    }

    if (existingItem) {
      this.cartItems.update(items => items.map(item =>
        item.productId === productId ? { ...item, quantity: quantityInCart } : item
      ));
    } else {
      this.cartItems.update(items => [...items, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: quantity!
      }]);
    }

    this.itemForm.reset({ productId: 0, quantity: 1 });
    this.productSearch.set('');
  }

  updateProductSearch(value: string): void {
    this.productSearch.set(value);
    this.itemErrorMessage.set('');

    const selectedProductId = this.itemForm.getRawValue().productId;
    const isSelectedVisible = this.filteredProducts().some(product => product.id === selectedProductId);

    if (!isSelectedVisible) {
      this.itemForm.patchValue({ productId: 0 });
    }
  }

  removeFromCart(productId: number): void {
    this.cartItems.update(items => items.filter(item => item.productId !== productId));
  }

  submitSale(): void {
    this.saleForm.markAllAsTouched();

    if (this.saleForm.invalid || this.cartItems().length === 0) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const { customerId, discountPercentage, paymentMethod } = this.saleForm.getRawValue();
    const request = {
      customerId: customerId!,
      discountPercentage: discountPercentage!,
      paymentMethod: paymentMethod!,
      saleItems: this.cartItems().map(item => ({ productId: item.productId, quantity: item.quantity }))
    };

    const subscription = this.#saleService.create(request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cartItems.set([]);
        this.saleForm.reset({ customerId: 0, discountPercentage: 0, paymentMethod: 'Cash' });
        this.loadData();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to complete sale.'));
        this.isSaving.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  toggleSaleDetails(saleId: number): void {
    this.expandedSaleId.set(this.expandedSaleId() === saleId ? null : saleId);
  }

  updateCurrentPage(page: number): void {
    this.currentPage.set(page);
    this.loadSales();
  }

  openEditSale(sale: Sale): void {
    this.editErrorMessage.set('');
    this.editingSale.set(sale);
    this.editForm.reset({
      customerId: sale.customerId,
      discountPercentage: sale.discountPercentage,
      paymentMethod: sale.paymentMethod
    });
  }

  cancelEditSale(): void {
    this.editingSale.set(null);
  }

  submitEditSale(): void {
    this.editForm.markAllAsTouched();

    const sale = this.editingSale();

    if (this.editForm.invalid || !sale) {
      return;
    }

    this.isSaving.set(true);
    this.editErrorMessage.set('');

    const { customerId, discountPercentage, paymentMethod } = this.editForm.getRawValue();
    const request = { customerId: customerId!, discountPercentage: discountPercentage!, paymentMethod: paymentMethod! };

    const subscription = this.#saleService.update(sale.id, request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.editingSale.set(null);
        this.loadData();
      },
      error: (error: HttpErrorResponse) => {
        this.editErrorMessage.set(this.#getErrorMessage(error, 'Failed to update sale.'));
        this.isSaving.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  voidSale(sale: Sale): void {
    if (!confirm(`Void sale #${sale.id}? Stock for its items will be restored.`)) {
      return;
    }

    this.isVoiding.set(true);
    this.errorMessage.set('');

    const subscription = this.#saleService.voidSale(sale.id).subscribe({
      next: () => {
        this.isVoiding.set(false);
        this.loadData();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to void sale.'));
        this.isVoiding.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  printSale(sale: Sale): void {
    this.printingSale.set(sale);
    setTimeout(() => window.print(), 0);
  }

  #getErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    return error.error?.Message ?? error.error?.message ?? defaultMessage;
  }
}
