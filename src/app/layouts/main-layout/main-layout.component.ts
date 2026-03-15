import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  isSidebarOpen = signal(true);
  today = new Date();

  menuItems: { path: string; icon: string; label: string; roles: string[] }[] = [
    { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard', roles: ['owner', 'admin', 'kasir'] },
    { path: '/pos', icon: 'bi-cart3', label: 'Kasir (POS)', roles: ['owner', 'admin', 'kasir'] },
    { path: '/products', icon: 'bi-box-seam', label: 'Produk', roles: ['owner', 'admin'] },
    { path: '/customers', icon: 'bi-people', label: 'Pelanggan', roles: ['owner', 'admin'] },
    { path: '/transactions', icon: 'bi-receipt', label: 'Transaksi', roles: ['owner', 'admin'] },
    { path: '/finance', icon: 'bi-wallet2', label: 'Keuangan', roles: ['owner'] },
    { path: '/reports', icon: 'bi-bar-chart-line', label: 'Laporan', roles: ['owner', 'admin'] },
    { path: '/users', icon: 'bi-people-fill', label: 'Users', roles: ['owner'] },
    { path: '/settings', icon: 'bi-gear', label: 'Pengaturan', roles: ['owner', 'admin', 'kasir'] },
  ];

  constructor(public authService: AuthService, private router: Router) {}

  canAccess(roles: string[]): boolean {
    return this.authService.hasRole(...roles);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}