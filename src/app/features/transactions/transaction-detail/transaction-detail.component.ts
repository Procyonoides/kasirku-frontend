import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TransactionService } from '../../../core/services/api.service';
import { RupiahPipe } from '../../../shared/pipes';
import { ReceiptService } from '../../../core/services/receipt.service';
import { PayDebtModalComponent } from '../../../shared/components/pay-debt-modal/pay-debt-modal.component';


@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink, RupiahPipe, PayDebtModalComponent],
  templateUrl: './transaction-detail.component.html',
  styleUrl: './transaction-detail.component.css'
})
export class TransactionDetailComponent implements OnInit {
  transaction: any = null;
  isLoading = true;

  // Info hutang (hanya terisi kalau metode pembayarannya hutang)
  debtInfo: any = null;
  showPayDebt = false;

  private transactionId = '';

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private receiptService: ReceiptService
  ) {}

  ngOnInit() {
    this.transactionId = this.route.snapshot.params['id'];
    this.loadTransaction();
  }

  private loadTransaction() {
    this.transactionService.getOne(this.transactionId).subscribe({
      next: (res) => {
        this.transaction = res.data;
        this.isLoading = false;
        if (this.transaction.paymentMethod === 'hutang') {
          this.loadDebtInfo();
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  private loadDebtInfo() {
    this.transactionService.getDebtInfo(this.transactionId).subscribe({
      next: (res) => { this.debtInfo = res.data; },
      error: () => { this.debtInfo = null; }
    });
  }

  // Tombol Bayar hanya muncul untuk hutang yang masih berjalan dan belum dibatalkan
  get canPayDebt(): boolean {
    return !!this.transaction
      && this.transaction.isDebt
      && this.transaction.status !== 'dibatalkan'
      && !!this.debtInfo
      && this.debtInfo.remaining > 0;
  }

  openPayDebt() {
    this.showPayDebt = true;
  }

  closePayDebt() {
    this.showPayDebt = false;
  }

  // Setelah pembayaran tercatat: tutup modal, lalu muat ulang status transaksi dan info hutang
  onDebtPaid() {
    this.showPayDebt = false;
    this.loadTransaction();
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

  getMethodLabel(method: string): string {
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

  printReceipt() {
    if (!this.transaction) return;
    this.receiptService.printReceipt(this.transaction);
  }

}