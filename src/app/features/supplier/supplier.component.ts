import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Supplier } from '../../core/models/supplier.model';
import { AuthService } from '../../core/services/auth.service';
import { SupplierService } from '../../core/services/supplier.service';
import { sriLankanPhoneValidator } from '../../core/validators/sri-lankan-phone.validator';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.scss'
})
export class SupplierComponent implements OnDestroy {
  readonly #authService = inject(AuthService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #subscriptions = new Subscription();
  readonly #supplierService = inject(SupplierService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly showForm = signal(false);
  readonly editingSupplierId = signal<number | null>(null);

  form = this.#formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.maxLength(15), sriLankanPhoneValidator()]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]]
  });

  constructor() {
    this.loadSuppliers();
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
  }

  get canManageSupplier(): boolean {
    const role = this.#authService.getUserRole();

    return role === 'Admin' || role === 'Manager';
  }

  loadSuppliers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const subscription = this.#supplierService.getAll().subscribe({
      next: suppliers => {
        this.suppliers.set(suppliers);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load suppliers.'));
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  openAddForm(): void {
    this.editingSupplierId.set(null);
    this.form.reset({ name: '', phone: '', email: '' });
    this.showForm.set(true);
  }

  openEditForm(supplier: Supplier): void {
    this.editingSupplierId.set(supplier.id);
    this.form.reset({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingSupplierId.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const { name, phone, email } = this.form.getRawValue();
    const request = {
      name: name!,
      phone: phone!.replace(/[\s-]/g, ''),
      email: email!
    };
    const supplierId = this.editingSupplierId();

    const save$ = supplierId
      ? this.#supplierService.update(supplierId, request)
      : this.#supplierService.create(request);

    const subscription = save$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cancelForm();
        this.loadSuppliers();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to save supplier.'));
        this.isSaving.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  deleteSupplier(supplier: Supplier): void {
    if (!confirm(`Delete supplier "${supplier.name}"?`)) {
      return;
    }

    const subscription = this.#supplierService.delete(supplier.id).subscribe({
      next: () => this.loadSuppliers(),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to delete supplier.'));
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
