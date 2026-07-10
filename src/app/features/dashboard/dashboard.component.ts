import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ProductCategoryService } from '../../core/services/product-category.service';
import { ProductService } from '../../core/services/product.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [PageHeaderComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnDestroy {
  readonly #authService = inject(AuthService);
  readonly #categoryService = inject(ProductCategoryService);
  readonly #productService = inject(ProductService);
  readonly #subscriptions = new Subscription();

  readonly productCount = signal<number | null>(null);
  readonly categoryCount = signal<number | null>(null);

  constructor() {
    const subscription = forkJoin({
      products: this.#productService.getAll(),
      categories: this.#categoryService.getAll()
    }).subscribe({
      next: ({ products, categories }) => {
        this.productCount.set(products.length);
        this.categoryCount.set(categories.length);
      },
      error: () => {
        this.productCount.set(null);
        this.categoryCount.set(null);
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
}
