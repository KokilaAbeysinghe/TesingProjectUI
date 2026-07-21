import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';

import { Product } from '../../core/models/product.model';
import { Sale } from '../../core/models/sale.model';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { ProductCategoryService } from '../../core/services/product-category.service';
import { ProductService } from '../../core/services/product.service';
import { SaleService } from '../../core/services/sale.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, PageHeaderComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnDestroy {
  readonly #authService = inject(AuthService);
  readonly #categoryService = inject(ProductCategoryService);
  readonly #customerService = inject(CustomerService);
  readonly #productService = inject(ProductService);
  readonly #saleService = inject(SaleService);
  readonly #subscriptions = new Subscription();

  readonly #lowStockThreshold = 10;

  readonly productCount = signal<number | null>(null);
  readonly categoryCount = signal<number | null>(null);
  readonly customerCount = signal<number | null>(null);
  readonly saleCount = signal<number | null>(null);
  readonly todaySalesCount = signal<number | null>(null);
  readonly todayRevenue = signal<number | null>(null);
  readonly lowStockProducts = signal<Product[]>([]);

  constructor() {
    const subscription = forkJoin({
      products: this.#productService.getAll(),
      categories: this.#categoryService.getAll(),
      customers: this.#customerService.getAll(),
      sales: this.#saleService.getAll()
    }).subscribe({
      next: ({ products, categories, customers, sales }) => {
        const todaySales = sales.filter(sale => this.#isTodaySale(sale));

        this.productCount.set(products.length);
        this.categoryCount.set(categories.length);
        this.customerCount.set(customers.length);
        this.saleCount.set(sales.length);
        this.todaySalesCount.set(todaySales.length);
        this.todayRevenue.set(
          todaySales.reduce((total, sale) => total + sale.totalAmount, 0)
        );
        this.lowStockProducts.set(
          products
            .filter(product => product.stock <= this.#lowStockThreshold)
            .sort((left, right) => left.stock - right.stock)
        );
      },
      error: () => {
        this.productCount.set(null);
        this.categoryCount.set(null);
        this.customerCount.set(null);
        this.saleCount.set(null);
        this.todaySalesCount.set(null);
        this.todayRevenue.set(null);
        this.lowStockProducts.set([]);
      }
    });

    this.#subscriptions.add(subscription);
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
  }

  get userEmail(): string | null {
    return this.#authService.getUserEmail();
  }

  get userRole(): string | null {
    return this.#authService.getUserRole();
  }

  get lowStockThreshold(): number {
    return this.#lowStockThreshold;
  }

  #isTodaySale(sale: Sale): boolean {
    if (sale.status === 'Voided') {
      return false;
    }

    const saleDate = new Date(sale.saleDate);
    const today = new Date();

    return saleDate.getFullYear() === today.getFullYear()
      && saleDate.getMonth() === today.getMonth()
      && saleDate.getDate() === today.getDate();
  }
}
