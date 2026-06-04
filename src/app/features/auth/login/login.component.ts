import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  readonly #authService = inject(AuthService);
  readonly #formBuilder = inject(FormBuilder);
  readonly #router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  form = this.#formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.form.getRawValue();

    this.#authService.login({ email: email!, password: password! }).subscribe({
      next: () => this.#router.navigate(['/app/dashboard']),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.#getErrorMessage(error, 'Invalid email or password.'));
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
