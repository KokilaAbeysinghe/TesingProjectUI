import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  readonly #authService = inject(AuthService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  form = this.#formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
    contactNumber: ['', [Validators.required, Validators.maxLength(10)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['Cashier']
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { name, email, contactNumber, password, role } = this.form.getRawValue();

    this.#authService.register({
      name: name!,
      email: email!,
      contactNumber: contactNumber!,
      password: password!,
      role: role!
    }).subscribe({
      next: () => this.#router.navigate(['/app/dashboard']),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Registration failed. Please try again.'));
        this.isLoading.set(false);
      }
    });
  }

  #getErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    return error.error?.Message ?? error.error?.message ?? defaultMessage;
  }
}
