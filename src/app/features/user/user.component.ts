import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { CreateUserRequest, UpdateUserRequest, User, UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { sriLankanPhoneValidator } from '../../core/validators/sri-lankan-phone.validator';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [PageHeaderComponent, PaginationComponent, ReactiveFormsModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnDestroy {
  readonly #authService = inject(AuthService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #router = inject(Router);
  readonly #subscriptions = new Subscription();
  readonly #userService = inject(UserService);

  readonly #pageSize = 5;

  readonly roles: UserRole[] = ['Cashier', 'Manager', 'Admin'];

  readonly users = signal<User[]>([]);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly showForm = signal(false);
  readonly editingUserId = signal<number | null>(null);

  form = this.#formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
    contactNumber: ['', [Validators.required, Validators.maxLength(10), sriLankanPhoneValidator()]],
    password: ['', [Validators.minLength(8)]],
    role: ['Cashier' as UserRole, [Validators.required]]
  });

  constructor() {
    if (this.#authService.getUserRole() !== 'Admin') {
      this.#router.navigate(['/app/dashboard']);

      return;
    }

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.#subscriptions.unsubscribe();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const subscription = this.#userService.getPaged(this.currentPage(), this.#pageSize).subscribe({
      next: result => {
        this.users.set(result.items);
        this.totalPages.set(Math.max(1, result.totalPages));
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to load staff.'));
        this.isLoading.set(false);
      }
    });

    this.#subscriptions.add(subscription);
  }

  updateCurrentPage(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  openAddForm(): void {
    this.editingUserId.set(null);
    this.form.reset({
      name: '',
      email: '',
      contactNumber: '',
      password: '',
      role: 'Cashier'
    });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.get('password')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  openEditForm(user: User): void {
    this.editingUserId.set(user.id);
    this.form.reset({
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      password: '',
      role: user.role
    });
    this.form.get('password')?.setValidators([Validators.minLength(8)]);
    this.form.get('password')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingUserId.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const { name, email, contactNumber, password, role } = this.form.getRawValue();
    const userId = this.editingUserId();
    const normalizedContact = contactNumber!.replace(/[\s-]/g, '');

    if (userId) {
      const request: UpdateUserRequest = {
        name: name!,
        email: email!,
        contactNumber: normalizedContact,
        role: role!
      };

      if (password) {
        request.password = password;
      }

      const subscription = this.#userService.update(userId, request).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.cancelForm();
          this.loadUsers();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.#getErrorMessage(error, 'Failed to update staff member.'));
          this.isSaving.set(false);
        }
      });

      this.#subscriptions.add(subscription);

      return;
    }

    const createRequest: CreateUserRequest = {
      name: name!,
      email: email!,
      contactNumber: normalizedContact,
      password: password!,
      role: role!
    };

    const createSubscription = this.#userService.create(createRequest).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.cancelForm();
        this.loadUsers();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to add staff member.'));
        this.isSaving.set(false);
      }
    });

    this.#subscriptions.add(createSubscription);
  }

  deleteUser(user: User): void {
    if (user.id === this.#authService.getUserId()) {
      this.errorMessage.set('You cannot delete your own account.');

      return;
    }

    if (!confirm(`Delete staff member "${user.name}"?`)) {
      return;
    }

    const subscription = this.#userService.delete(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Failed to delete staff member.'));
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
