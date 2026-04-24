import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ProductService } from '../../core/services/api.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = signal(true);
  today = new Date();
  now = new Date();
  lowStockProducts: any[] = [];
  showStockNotif = false;
  private clockInterval: any;

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

  constructor(public authService: AuthService, public router: Router, private productService: ProductService) {}

  canAccess(roles: string[]): boolean {
    return this.authService.hasRole(...roles);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }

  ngOnInit() {
    this.loadLowStock();
    setInterval(() => this.loadLowStock(), 30 * 1000); // refresh tiap 30 detik
    // Live clock
    this.clockInterval = setInterval(() => { this.now = new Date(); }, 1000);
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  loadLowStock() {
    this.productService.getLowStock().subscribe({
      next: (res) => { this.lowStockProducts = res.data; }
    });
  }

  toggleStockNotif() {
    this.showStockNotif = !this.showStockNotif;
  }
}