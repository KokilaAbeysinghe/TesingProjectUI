import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Subscription, debounceTime } from 'rxjs';

import { ProductCategory } from '../../core/models/product-category.model';
import { Product } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { ProductCategoryService } from '../../core/services/product-category.service';
import { ProductService } from '../../core/services/product.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [DecimalPipe, PageHeaderComponent, PaginationComponent, ReactiveFormsModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent implements OnDestroy {
  readonly #authService = inject(AuthService);
  readonly #categoryService = inject(ProductCategoryService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #productService = inject(ProductService);
  readonly #subscriptions = new Subscription();
  readonly #searchChange = new Subject<void>();
  readonly #pageSize = 5;

  readonly products = signal<Product[]>([]);
  readonly categories = signal<ProductCategory[]>([]);
  readonly productSearch = signal('');
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly count =signal(0);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly showForm = signal(false);
  readonly editingProductId = signal<number | null>(null);

  form = this.#formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    productCategoryId: [0, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]]
  });

  constructor() {
    this.loadCategories();
    this.loadProducts();
    this.loadcount();

    const searchSubscription = this.#searchChange.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(1);
      this.loadProducts();
    });

    this.#subscriptions.add(searchSubscription);
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
  }

  get canAddProduct(): boolean {
    const role = this.#authService.getUserRole();

    return role === 'Admin' || role === 'Manager';
  }

  get canDeleteProduct(): boolean {
    return this.#authService.getUserRole() === 'Admin';
  }

  updateProductSearch(value: string): void {
    this.productSearch.set(value);
    this.#searchChange.next();
  }

  updateCurrentPage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  loadCategories(): void {
    const subscription = this.#categoryService.getAll().subscribe({
      next: categories => this.categories.set(categories),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load categories.'));
      }
    });

    this.#subscriptions.add(subscription);
  }
loadcount(): void {
    const subscription = this.#productService.count().subscribe({
      next: count => this.count.set(count),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load product count.'));
      }
    });

    this.#subscriptions.add(subscription);
  }


  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const search = this.productSearch().trim() || undefined;

    const subscription = this.#productService.getPaged(this.currentPage(), this.#pageSize, search).subscribe({
      next: result => {
        this.products.set(result.items);
        this.totalPages.set(Math.max(1, result.totalPages));
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load products.'));
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  openAddForm(): void {
    this.editingProductId.set(null);
    this.form.reset({ name: '', productCategoryId: this.categories()[0]?.id ?? 0, price: 0, stock: 0 });
    this.showForm.set(true);
  }

  openEditForm(product: Product): void {
    this.editingProductId.set(product.id);
    this.form.reset({
      name: product.name,
      productCategoryId: product.productCategoryId,
      price: product.price,
      stock: product.stock
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingProductId.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const { name, productCategoryId, price, stock } = this.form.getRawValue();
    const request = {
      name: name!,
      productCategoryId: Number(productCategoryId),
      price: Number(price),
      stock: Number(stock)
    };
    const productId = this.editingProductId();
    const isNewProduct = !productId;

    const save$ = productId
      ? this.#productService.update(productId, request)
      : this.#productService.create(request);

    const subscription = save$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cancelForm();

        if (isNewProduct) {
          this.currentPage.set(1);
        }

        this.loadProducts();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to save product.'));
        this.isSaving.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Delete product "${product.name}"?`)) {
      return;
    }

    const subscription = this.#productService.delete(product.id).subscribe({
      next: () => {
        if (this.currentPage() > 1 && this.products().length === 1) {
          this.currentPage.set(this.currentPage() - 1);
        }

        this.loadProducts();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to delete product.'));
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
