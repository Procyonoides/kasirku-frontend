import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/api.service';
import { DashboardStats, Transaction } from '../../shared/models';
import { RupiahPipe } from '../../shared/pipes';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { SettingService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    RouterLink,
    RupiahPipe,
    LoadingSpinnerComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentTransactions: Transaction[] = [];
  salesChart: any[] = [];
  isLoading = true;
  selectedPeriod = '7d';
  storeName = 'KasirKu';

  constructor(private dashboardService: DashboardService, private settingService: SettingService) {}

  ngOnInit() {
    this.loadAll();
    this.loadStoreName();
  }

  loadAll() {
    this.isLoading = true;
    this.loadStats();
    this.loadRecent();
    this.loadChart();
  }

  loadStats() {
    this.dashboardService.getStats().subscribe({
      next: (res) => {
        this.stats = res.data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadRecent() {
    this.dashboardService.getRecent().subscribe({
      next: (res) => { this.recentTransactions = res.data; }
    });
  }

  loadChart() {
    this.dashboardService.getSalesChart(this.selectedPeriod).subscribe({
      next: (res) => { this.salesChart = res.data; }
    });
  }

  loadStoreName() {
    this.settingService.get().subscribe({
      next: (res) => { this.storeName = res.data.storeName || 'KasirKu'; }
    });
  }

  changePeriod(period: string) {
    this.selectedPeriod = period;
    this.loadChart();
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      selesai: 'bg-success',
      hutang: 'bg-warning text-dark',
      dibatalkan: 'bg-danger'
    };
    return map[status] || 'bg-secondary';
  }

  getPaymentIcon(method: string): string {
    const map: Record<string, string> = {
      tunai: 'bi-cash-coin',
      transfer: 'bi-bank',
      qris: 'bi-qr-code',
      hutang: 'bi-clock-history',
      kartu_debit: 'bi-credit-card',
      kartu_kredit: 'bi-credit-card-2-front'
    };
    return map[method] || 'bi-cash';
  }

  getMaxRevenue(): number {
    if (this.salesChart.length === 0) return 1;
    return Math.max(...this.salesChart.map(i => i.revenue));
  }

  getBarHeight(revenue: number): string {
    const px = (revenue / this.getMaxRevenue()) * 160;
    return Math.max(px, 8) + 'px'; // minimum 8px agar selalu terlihat
  }
}
