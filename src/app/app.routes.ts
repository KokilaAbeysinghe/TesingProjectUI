import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'signup',
        loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/product-category/product-category.component').then(m => m.ProductCategoryComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/product/product.component').then(m => m.ProductComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./features/supplier/supplier.component').then(m => m.SupplierComponent)
      },
      {
        path: 'purchases',
        loadComponent: () => import('./features/purchase/purchase.component').then(m => m.PurchaseComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customer/customer.component').then(m => m.CustomerComponent)
      },
      {
        path: 'sales',
        loadComponent: () => import('./features/sale/sale.component').then(m => m.SaleComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/report/report.component').then(m => m.ReportComponent)
      },
      {
        path: 'staff',
        loadComponent: () => import('./features/user/user.component').then(m => m.UserComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
