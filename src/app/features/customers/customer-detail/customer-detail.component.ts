import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService, TransactionService } from '../../../core/services/api.service';
import { RupiahPipe } from '../../../shared/pipes';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RupiahPipe, NgClass],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.css'
})
export class CustomerDetailComponent implements OnInit {
  customer: any = null;
  transactions: any[] = [];
  isLoading = true;
  customerId = '';

  showPayDebtModal = false;
  selectedDebtTx: any = null;
  payAmount = 0;
  payMethod = 'tunai';
  payError = '';
  paySubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private transactionService: TransactionService
  ) {}

  ngOnInit() {
    this.customerId = this.route.snapshot.params['id'];
    this.loadCustomer();
    this.loadTransactions();
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

  getDebtTransactions() {
    return this.transactions.filter(t => t.status === 'hutang');
  }

  openPayDebt(tx: any) {
    this.selectedDebtTx = tx;
    this.payAmount = tx.grandTotal;
    this.payMethod = 'tunai';
    this.payError = '';
    this.showPayDebtModal = true;
  }

  closePayDebt() { this.showPayDebtModal = false; }

  submitPayDebt() {
    if (this.payAmount <= 0) { this.payError = 'Nominal harus lebih dari 0'; return; }
    this.paySubmitting = true;
    this.payError = '';

    this.transactionService.payDebt(this.selectedDebtTx._id, {
      amountPaid: this.payAmount,
      paymentMethod: this.payMethod
    }).subscribe({
      next: () => {
        this.showPayDebtModal = false;
        this.paySubmitting = false;
        this.loadCustomer();
        this.loadTransactions();
      },
      error: (err) => {
        this.payError = err?.error?.message || 'Terjadi kesalahan';
        this.paySubmitting = false;
      }
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
