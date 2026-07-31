import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ProductCategory } from '../../core/models/product-category.model';
import { ProductCategoryService } from '../../core/services/product-category.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-product-category',
  standalone: true,
  imports: [PageHeaderComponent, PaginationComponent, ReactiveFormsModule],
  templateUrl: './product-category.component.html',
  styleUrl: './product-category.component.scss'
})
export class ProductCategoryComponent implements OnDestroy {
  readonly #categoryService = inject(ProductCategoryService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #subscriptions = new Subscription();

  readonly #pageSize = 5;

  readonly categories = signal<ProductCategory[]>([]);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly showForm = signal(false);
  readonly editingCategoryId = signal<number | null>(null);

  form = this.#formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]]
  });

  constructor() {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const subscription = this.#categoryService.getPaged(this.currentPage(), this.#pageSize).subscribe({
      next: result => {
        this.categories.set(result.items);
        this.totalPages.set(Math.max(1, result.totalPages));
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load categories.'));
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  updateCurrentPage(page: number): void {
    this.currentPage.set(page);
    this.loadCategories();
  }

  openAddForm(): void {
    this.editingCategoryId.set(null);
    this.form.reset({ name: '', description: '' });
    this.showForm.set(true);
  }

  openEditForm(category: ProductCategory): void {
    this.editingCategoryId.set(category.id);
    this.form.reset({ name: category.name, description: category.description });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingCategoryId.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const { name, description } = this.form.getRawValue();
    const request = { name: name!, description: description ?? '' };
    const categoryId = this.editingCategoryId();

    const save$ = categoryId
      ? this.#categoryService.update(categoryId, request)
      : this.#categoryService.create(request);

    const subscription = save$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cancelForm();
        this.loadCategories();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to save category.'));
        this.isSaving.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  deleteCategory(category: ProductCategory): void {
    if (!confirm(`Delete category "${category.name}"?`)) {
      return;
    }

    const subscription = this.#categoryService.delete(category.id).subscribe({
      next: () => this.loadCategories(),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to delete category.'));
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
