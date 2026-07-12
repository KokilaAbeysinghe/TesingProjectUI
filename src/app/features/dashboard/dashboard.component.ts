import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ProductCategoryService } from '../../core/services/product-category.service';
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
  readonly #subscriptions = new Subscription();

  readonly categoryCount = signal<number | null>(null);

  constructor() {
    const subscription = this.#categoryService.getAll().subscribe({
      next: categories => this.categoryCount.set(categories.length),
      error: () => this.categoryCount.set(null)
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
