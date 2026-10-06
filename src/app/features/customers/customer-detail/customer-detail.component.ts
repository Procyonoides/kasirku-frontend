import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService, TransactionService } from '../../../core/services/api.service';
import { RupiahPipe } from '../../../shared/pipes';
import { PayDebtModalComponent } from '../../../shared/components/pay-debt-modal/pay-debt-modal.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RupiahPipe, NgClass, PayDebtModalComponent],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.css'
})
export class CustomerDetailComponent implements OnInit {
  customer: any = null;
  transactions: any[] = [];
  pointHistory: any[] = [];
  currentPoints = 0;
  activeTab = 'transactions';
  isLoading = true;
  customerId = '';

  showPayDebtModal = false;
  payDebtTxId = '';

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private transactionService: TransactionService
  ) {}

  ngOnInit() {
    this.customerId = this.route.snapshot.params['id'];
    this.loadCustomer();
    this.loadTransactions();
    this.loadPointHistory();
  }

  loadCustomer() {
    this.customerService.getById(this.customerId).subscribe({
      next: (res) => { this.customer = res.data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  loadTransactions() {
    this.transactionService.getAll({ customer: this.customerId, limit: 50 }).subscribe({
      next: (res) => { this.transactions = res.data; }
    });
  }

  loadPointHistory() {
    this.customerService.getPointHistory(this.customerId).subscribe({
      next: (res) => {
        this.pointHistory = res.data;
        this.currentPoints = res.currentPoints;
      }
    });
  }

  getDebtTransactions() {
    return this.transactions.filter(t => t.status === 'hutang');
  }

  openPayDebt(tx: any) {
    this.payDebtTxId = tx._id;
    this.showPayDebtModal = true;
  }

  closePayDebt() { this.showPayDebtModal = false; }

  onDebtPaid() {
    this.showPayDebtModal = false;
    this.loadCustomer();
    this.loadTransactions();
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      selesai: 'badge-selesai',
      hutang: 'badge-hutang',
      dibatalkan: 'badge-batal'
    };
    return map[status] || 'bg-secondary';
  }

  getTierBadge(tier: string): string {
    const map: Record<string, string> = {
      regular: 'bg-secondary',
      silver: 'badge-silver',
      gold: 'badge-gold',
      platinum: 'badge-platinum'
    };
    return map[tier] || 'bg-secondary';
  }
}
