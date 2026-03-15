import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'products',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent)
          },
          {
            path: 'add',
            loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent)
          },
        ]
      },
      {
        path: 'customers',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./features/customers/customer-list/customer-list.component').then(m => m.CustomerListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/customers/customer-detail/customer-detail.component').then(m => m.CustomerDetailComponent)
          },
        ]
      },
      {
        path: 'transactions',
        children: [
          {
            path: '',
            canActivate: [roleGuard],
            data: { roles: ['owner', 'admin'] },
            loadComponent: () => import('./features/transactions/transaction-list/transaction-list.component').then(m => m.TransactionListComponent)
          },
          {
            path: ':id',
            canActivate: [roleGuard],
            data: { roles: ['owner', 'admin'] },
            loadComponent: () => import('./features/transactions/transaction-detail/transaction-detail.component').then(m => m.TransactionDetailComponent)
          }
        ]
      },
      {
        path: 'finance',
        canActivate: [roleGuard],
        data: { roles: ['owner'] },
        loadComponent: () => import('./features/finance/finance.component').then(m => m.FinanceComponent)
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['owner'] },
        loadComponent: () => import('./features/users/user-management/user-management.component').then(m => m.UserManagementComponent)
      },
    ]
  },
  { path: '**', redirectTo: '/dashboard' },
];