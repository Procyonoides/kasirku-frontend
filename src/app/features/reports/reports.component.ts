import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/api.service';
import { RupiahPipe } from '../../shared/pipes';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe, NgClass],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  activeTab: 'sales' | 'profit' | 'top-products' | 'cashflow' = 'sales';
  isLoading = false;
  dateFrom = '';
  dateTo = '';

  salesData: any = null;
  profitData: any = null;
  topProducts: any[] = [];
  cashflowData: any = null;

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    this.dateFrom = firstDay;
    this.dateTo = today;
    this.loadReport();
  }

  loadReport() {
    this.isLoading = true;
    const params = { startDate: this.dateFrom, endDate: this.dateTo };

    switch (this.activeTab) {
      case 'sales':
        this.reportService.getSalesReport(params).subscribe({
          next: (res) => { this.salesData = res.data; this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
        break;
      case 'profit':
        this.reportService.getProfitLoss(params).subscribe({
          next: (res) => { this.profitData = res.data; this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
        break;
      case 'top-products':
        this.reportService.getTopProducts(params).subscribe({
          next: (res) => { this.topProducts = res.data; this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
        break;
      case 'cashflow':
        this.reportService.getCashflow(params).subscribe({
          next: (res) => { this.cashflowData = res.data; this.isLoading = false; },
          error: () => { this.isLoading = false; }
        });
        break;
    }
  }

  switchTab(tab: 'sales' | 'profit' | 'top-products' | 'cashflow') {
    this.activeTab = tab;
    this.loadReport();
  }

  onFilter() { this.loadReport(); }

  getMaxQty(): number {
    if (!this.topProducts.length) return 1;
    return Math.max(...this.topProducts.map(p => p.totalQuantity));
  }

}
