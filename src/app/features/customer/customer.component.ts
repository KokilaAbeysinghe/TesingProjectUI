import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Customer } from '../../core/models/customer.model';
import { CustomerService } from '../../core/services/customer.service';
import { sriLankanPhoneValidator } from '../../core/validators/sri-lankan-phone.validator';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [PageHeaderComponent, ReactiveFormsModule],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss'
})
export class CustomerComponent implements OnDestroy {
  readonly #customerService = inject(CustomerService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #subscriptions = new Subscription();

  readonly customers = signal<Customer[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly showForm = signal(false);
  readonly editingCustomerId = signal<number | null>(null);

  form = this.#formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.maxLength(15), sriLankanPhoneValidator()]]
  });

  constructor() {
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
  }

  loadCustomers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const subscription = this.#customerService.getAll().subscribe({
      next: customers => {
        this.customers.set(customers);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load customers.'));
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  openAddForm(): void {
    this.editingCustomerId.set(null);
    this.form.reset({ name: '', phone: '' });
    this.showForm.set(true);
  }

  openEditForm(customer: Customer): void {
    this.editingCustomerId.set(customer.id);
    this.form.reset({ name: customer.name, phone: customer.phone });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingCustomerId.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const { name, phone } = this.form.getRawValue();
    const request = { name: name!, phone: phone!.replace(/[\s-]/g, '') };
    const customerId = this.editingCustomerId();

    const save$ = customerId
      ? this.#customerService.update(customerId, request)
      : this.#customerService.create(request);

    const subscription = save$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cancelForm();
        this.loadCustomers();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to save customer.'));
        this.isSaving.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  deleteCustomer(customer: Customer): void {
    if (!confirm(`Delete customer "${customer.name}"?`)) {
      return;
    }

    const subscription = this.#customerService.delete(customer.id).subscribe({
      next: () => this.loadCustomers(),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to delete customer.'));
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
