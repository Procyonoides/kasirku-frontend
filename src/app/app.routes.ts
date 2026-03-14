import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { ProductFormComponent } from './features/products/product-form/product-form.component';
import { CustomerListComponent } from './features/customers/customer-list/customer-list.component';
import { TransactionListComponent } from './features/transactions/transaction-list/transaction-list.component';
import { FinanceComponent } from './features/finance/finance.component';
import { PosComponent } from './features/pos/pos.component';
import { ReportsComponent } from './features/reports/reports.component';
import { SettingsComponent } from './features/settings/settings.component';

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
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent)
      },
      { path: 'pos', component: PosComponent },
      {
        path: 'products',
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
            { path: 'products/add', component: ProductFormComponent },
            { path: 'products/:id/edit', component: ProductFormComponent },
        ]
      },
      {
        path: 'customers',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/customers/customer-list/customer-list.component').then(m => m.CustomerListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/customers/customer-detail/customer-detail.component').then(m => m.CustomerDetailComponent)
          },
          { path: 'customers', component: CustomerListComponent },
        ]
      },
      {
        path: 'transactions',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/transactions/transaction-list/transaction-list.component').then(m => m.TransactionListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/transactions/transaction-detail/transaction-detail.component').then(m => m.TransactionDetailComponent)
          },
          { path: 'transactions', component: TransactionListComponent },
        ]
      },
      {
        path: 'finance',
        loadComponent: () => import('./features/finance/finance.component').then(m => m.FinanceComponent),
      },
      { path: 'finance', component: FinanceComponent },
      {
        path: 'reports',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
          },
          {
            path: 'profit-loss',
            loadComponent: () => import('./features/reports/profit-loss/profit-loss.component').then(m => m.ProfitLossComponent)
          },
          {
            path: 'top-products',
            loadComponent: () => import('./features/reports/top-products/top-products.component').then(m => m.TopProductsComponent)
          }
        ]
      },
      { path: 'reports', component: ReportsComponent },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/dashboard' },
];
