import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly #authService = inject(AuthService);
  readonly #router = inject(Router);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/app/dashboard' },
    { label: 'Categories', icon: '🗂️', route: '/app/categories' }
  ];

  get userEmail(): string | null {
    return this.#authService.getUserEmail();
  }

  get userRole(): string | null {
    return this.#authService.getUserRole();
  }

  logout(): void {
    this.#authService.logout();
    this.#router.navigate(['/login']);
  }
}
