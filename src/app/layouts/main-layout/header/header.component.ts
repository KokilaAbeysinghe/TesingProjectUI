import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly #authService = inject(AuthService);

  readonly today = new Date();

  get userRole(): string | null {
    return this.#authService.getUserRole();
  }
}
