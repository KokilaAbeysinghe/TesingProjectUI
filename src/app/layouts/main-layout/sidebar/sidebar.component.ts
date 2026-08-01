import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  hideForCashier?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly #authService = inject(AuthService);
  readonly #router = inject(Router);

  readonly #allNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard' },
    { label: 'Sales', icon: 'receipt', route: '/app/sales' },
    { label: 'Products', icon: 'inventory_2', route: '/app/products' },
    { label: 'Inventory', icon: 'list_alt', route: '/app/inventory' },
    { label: 'Suppliers', icon: 'local_shipping', route: '/app/suppliers', hideForCashier: true },
    { label: 'Purchases', icon: 'shopping_cart', route: '/app/purchases', hideForCashier: true },
    { label: 'Categories', icon: 'category', route: '/app/categories' },
    { label: 'Customers', icon: 'person_pin_circle', route: '/app/customers' },
    { label: 'Reports', icon: 'assessment', route: '/app/reports', hideForCashier: true },
    { label: 'Staff', icon: 'group', route: '/app/staff', adminOnly: true }
  ];

  get navItems(): NavItem[] {
    const role = this.#authService.getUserRole();

    return this.#allNavItems.filter(item => {
      if (item.adminOnly && role !== 'Admin') {
        return false;
      }

      if (item.hideForCashier && role === 'Cashier') {
        return false;
      }

      return true;
    });
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

