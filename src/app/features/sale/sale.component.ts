import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';

import { Customer } from '../../core/models/customer.model';
import { Product } from '../../core/models/product.model';
import { Sale } from '../../core/models/sale.model';
import { CustomerService } from '../../core/services/customer.service';
import { ProductService } from '../../core/services/product.service';
import { SaleService } from '../../core/services/sale.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [DatePipe, DecimalPipe, PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './sale.component.html',
  styleUrl: './sale.component.scss'
})
export class SaleComponent implements OnDestroy {
  readonly #customerService = inject(CustomerService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #productService = inject(ProductService);
  readonly #saleService = inject(SaleService);
  readonly #subscriptions = new Subscription();

  readonly customers = signal<Customer[]>([]);
  readonly products = signal<Product[]>([]);
  readonly sales = signal<Sale[]>([]);
  readonly cartItems = signal<CartItem[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly itemErrorMessage = signal('');
  readonly expandedSaleId = signal<number | null>(null);

  saleForm = this.#formBuilder.group({
    customerId: [0, [Validators.required, Validators.min(1)]]
  });

  itemForm = this.#formBuilder.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  constructor() {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
  }

  get cartTotal(): number {
    return this.cartItems().reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const subscription = forkJoin({
      customers: this.#customerService.getAll(),
      products: this.#productService.getAll(),
      sales: this.#saleService.getAll()
    }).subscribe({
      next: ({ customers, products, sales }) => {
        this.customers.set(customers);
        this.products.set(products);
        this.sales.set(sales);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load sales data.'));
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

    const { customerId } = this.saleForm.getRawValue();
    const request = {
      customerId: customerId!,
      saleItems: this.cartItems().map(item => ({ productId: item.productId, quantity: item.quantity }))
    };

    const subscription = this.#saleService.create(request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cartItems.set([]);
        this.saleForm.reset({ customerId: 0 });
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

  #getErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    return error.error?.Message ?? error.error?.message ?? defaultMessage;
  }
}
