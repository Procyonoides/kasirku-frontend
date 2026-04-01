import { Chart, registerables } from 'chart.js';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, ReportService, SettingService, ProductService } from '../../core/services/api.service';
import { DashboardStats, Transaction } from '../../shared/models';
import { RupiahPipe } from '../../shared/pipes';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

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
export class DashboardComponent implements OnInit, AfterViewInit {
  stats: DashboardStats | null = null;
  recentTransactions: Transaction[] = [];
  lowStockProducts: any[] = [];
  salesChart: any[] = [];
  isLoading = true;
  selectedPeriod = '7d';
  storeName = 'KasirKu';
  isToday = false;
  topProducts: any[] = [];
  barChartData: any = null;
  pieChartData: any = null;

  @ViewChild('barCanvas') barCanvas!: ElementRef;
  @ViewChild('pieCanvas') pieCanvas!: ElementRef;

  private barChart: any = null;
  private pieChart: any = null;

  constructor(
    private dashboardService: DashboardService, 
    private settingService: SettingService,
    private productService: ProductService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.loadAll();
    this.loadStoreName();
  }

  ngAfterViewInit() {
    // chart akan diinisialisasi setelah data loaded
  }

  loadAll() {
    this.isLoading = true;
    this.loadStats();
    this.loadRecent();
    this.loadChart();
    this.loadLowStock();
    this.loadTopProducts();
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
      next: (res) => { this.recentTransactions = res.data.slice(0, 5); }
    });
  }

  loadChart() {
    this.dashboardService.getSalesChart(this.selectedPeriod).subscribe({
      next: (res) => {
        this.salesChart = res.data;
        this.renderBarChart();
      }
    });
  }

  renderBarChart() {
    if (this.barChart) {
      this.barChart.destroy();
    }
    setTimeout(() => {
      const canvas = document.getElementById('barCanvas') as HTMLCanvasElement;
      if (!canvas || !this.salesChart.length) return;

      this.barChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: this.salesChart.map((i: any) => this.isToday ? i._id : i._id?.slice(5)),
          datasets: [{
            data: this.salesChart.map((i: any) => i.revenue),
            backgroundColor: '#2563eb',
            borderRadius: 6,
            hoverBackgroundColor: '#1e3a5f'
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
              ticks: {
                callback: (value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`
              }
            }
          }
        }
      });
    }, 100);
  }

  loadStoreName() {
    this.settingService.get().subscribe({
      next: (res) => { this.storeName = res.data.storeName || 'KasirKu'; }
    });
  }

  loadLowStock() {
    this.productService.getLowStock().subscribe({
      next: (res) => { this.lowStockProducts = res.data.slice(0, 5); }
    });
  }

  loadTopProducts() {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    this.reportService.getTopProducts({ startDate: firstDay, endDate: today, limit: 5 }).subscribe({
      next: (res) => {
        this.topProducts = res.data;
        this.renderPieChart();
      }
    });
  }

  renderPieChart() {
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    setTimeout(() => {
      const canvas = document.getElementById('pieCanvas') as HTMLCanvasElement;
      if (!canvas || !this.topProducts.length) return;

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
          layout: {
            padding: 20
          },
          plugins: {
            legend: {
              position: 'right',
              labels: { font: { size: 12 }, padding: 16 }
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
}
