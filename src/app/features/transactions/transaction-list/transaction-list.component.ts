import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../core/services/api.service';
import { Transaction } from '../../../shared/models';
import { RupiahPipe } from '../../../shared/pipes';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink, FormsModule, RupiahPipe],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.css'
})
export class TransactionListComponent implements OnInit {
  transactions: Transaction[] = [];
  isLoading = true;
  dateFrom = '';
  dateTo = '';
  selectedStatus = '';
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.dateFrom = today;
    this.dateTo = today;
    this.loadTransactions();
  }

  loadTransactions() {
    this.isLoading = true;
    const params: any = { page: this.currentPage, limit: 20 };
    if (this.dateFrom) params.startDate = this.dateFrom;
    if (this.dateTo) params.endDate = this.dateTo;
    if (this.selectedStatus) params.status = this.selectedStatus;

    this.transactionService.getAll(params).subscribe({
      next: (res) => {
        this.transactions = res.data;
        this.totalItems = res.pagination?.total || res.data.length;
        this.totalPages = res.pagination?.pages || 1;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onFilter() { this.currentPage = 1; this.loadTransactions(); }

  resetFilter() {
    const today = new Date().toISOString().split('T')[0];
    this.dateFrom = today;
    this.dateTo = today;
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadTransactions();
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadTransactions();
  }

  cancelTransaction(id: string, invoice: string) {
    if (!confirm(`Batalkan transaksi ${invoice}?`)) return;
    this.transactionService.cancel(id).subscribe({
      next: () => this.loadTransactions()
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      selesai: 'badge-selesai',
      hutang: 'badge-hutang',
      dibatalkan: 'badge-batal'
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

  getTotalRevenue(): number {
    return this.transactions
      .filter(t => t.status === 'selesai')
      .reduce((sum, t) => sum + t.grandTotal, 0);
  }
}
