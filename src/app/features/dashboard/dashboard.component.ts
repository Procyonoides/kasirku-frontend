import { Chart, registerables } from 'chart.js';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, ReportService, SettingService, ProductService } from '../../core/services/api.service';
import { DashboardStats, Transaction } from '../../shared/models';
import { RupiahPipe } from '../../shared/pipes';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ThemeService } from '../../core/services/theme.service';

Chart.register(...registerables);

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
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  stats: DashboardStats | null = null;
  recentTransactions: Transaction[] = [];
  lowStockProducts: any[] = [];
  dailyRecap: any = null;
  paymentEntries: any[] = [];
  salesChart: any[] = [];
  isLoading = true;
  selectedPeriod = '7d';
  storeName = 'KasirKu';
  today = new Date();
  isToday = false;
  topProducts: any[] = [];
  barChartData: any = null;
  pieChartData: any = null;

  @ViewChild('barCanvas') barCanvas!: ElementRef;
  @ViewChild('pieCanvas') pieCanvas!: ElementRef;

  private barChart: any = null;
  private pieChart: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService, 
    private settingService: SettingService,
    private productService: ProductService,
    private reportService: ReportService,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    this.loadAll();
    this.loadStoreName();
  }

  ngAfterViewInit() {
    // chart akan diinisialisasi setelah data loaded
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }
  }

  loadAll() {
    this.isLoading = true;
    this.loadStats();
    this.loadRecent();
    this.loadChart();
    this.loadLowStock();
    this.loadTopProducts();
    this.loadDailyRecap();
  }

  loadStats() {
    this.dashboardService.getStats().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.stats = res.data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadRecent() {
    this.dashboardService.getRecent().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { this.recentTransactions = res.data.slice(0, 5); }
    });
  }

  loadChart() {
    this.dashboardService.getSalesChart(this.selectedPeriod).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.salesChart = res.data;
        this.renderBarChart();
      }
    });
  }

  renderBarChart() {
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }
    setTimeout(() => {
      const canvas = document.getElementById('barCanvas') as HTMLCanvasElement;
      if (!canvas || !this.salesChart.length) return;

      const isDark = this.themeService.isDark();
      const labelColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)';

      this.barChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: this.salesChart.map((i: any) => this.isToday ? i._id : i._id?.slice(5)),
          datasets: [{
            data: this.salesChart.map((i: any) => i.revenue),
            backgroundColor: '#2563eb',
            borderRadius: 6,
            hoverBackgroundColor: isDark ? '#3b82f6' : '#1e3a5f'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => `Rp ${Number(ctx.raw).toLocaleString('id-ID')}`
              }
            }
          },
          scales: {
            y: {
              grid: { color: gridColor },
              ticks: {
                color: labelColor,
                callback: (value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`
              }
            },
            x: {
              grid: { color: gridColor },
              ticks: { color: labelColor }
            }
          }
        }
      });
    }, 100);
  }

  loadStoreName() {
    this.settingService.get().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { this.storeName = res.data.storeName || 'KasirKu'; }
    });
  }

  loadLowStock() {
    this.productService.getLowStock().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { this.lowStockProducts = res.data.slice(0, 5); }
    });
  }

  loadDailyRecap() {
    this.dashboardService.getDailyRecap().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { 
        this.dailyRecap = res.data;
        this.paymentEntries = Object.entries(res.data.paymentBreakdown).map(([key, value]: any) => ({
          method: key,
          label: this.getPaymentLabel(key),
          count: value.count,
          total: value.total
        }));
      }
    });
  }

  loadTopProducts() {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    this.reportService.getTopProducts({ startDate: firstDay, endDate: today, limit: 5 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.topProducts = res.data;
        this.renderPieChart();
      }
    });
  }

  renderPieChart() {
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }
    setTimeout(() => {
      const canvas = document.getElementById('pieCanvas') as HTMLCanvasElement;
      if (!canvas || !this.topProducts.length) return;

      const isDark = this.themeService.isDark();
      const labelColor = isDark ? '#94a3b8' : '#374151';

      this.pieChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: this.topProducts.map((p: any) => p.productName),
          datasets: [{
            data: this.topProducts.map((p: any) => p.totalQty || 0),
            backgroundColor: ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed'],
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 20 },
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: labelColor,
                font: { size: 12 },
                padding: 16
              }
            },
            tooltip: {
              callbacks: {
                label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} terjual`
              }
            }
          }
        }
      });
    }, 100);
  }

  changePeriod(period: string) {
    this.selectedPeriod = period;
    this.isToday = period === 'today';
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

  getPaymentLabel(method: string): string {
    const map: Record<string, string> = {
      tunai: 'Tunai',
      transfer: 'Transfer',
      qris: 'QRIS',
      hutang: 'Hutang',
      kartu_debit: 'Kartu Debit',
      kartu_kredit: 'Kartu Kredit'
    };
    return map[method] || method;
  }

  
}
