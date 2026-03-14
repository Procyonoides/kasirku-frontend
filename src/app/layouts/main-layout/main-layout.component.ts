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

  menuItems = [
    { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/pos', icon: 'bi-cart3', label: 'Kasir (POS)' },
    { path: '/products', icon: 'bi-box-seam', label: 'Produk' },
    { path: '/customers', icon: 'bi-people', label: 'Pelanggan' },
    { path: '/transactions', icon: 'bi-receipt', label: 'Transaksi' },
    { path: '/finance', icon: 'bi-wallet2', label: 'Keuangan' },
    { path: '/reports', icon: 'bi-bar-chart-line', label: 'Laporan' },
    { path: '/settings', icon: 'bi-gear', label: 'Pengaturan' },
  ];

  constructor(public authService: AuthService, private router: Router) {}

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}