import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
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

  readonly #allNavItems: NavItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/app/dashboard' },
    { label: 'Products', icon: '📦', route: '/app/products' },
    { label: 'Categories', icon: '🗂️', route: '/app/categories' },
    { label: 'Staff', icon: '🧑‍💼', route: '/app/staff', adminOnly: true }
  ];

  get navItems(): NavItem[] {
    const role = this.#authService.getUserRole();

    return this.#allNavItems.filter(item => !item.adminOnly || role === 'Admin');
  }

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
