import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { RupiahPipe } from '../../pipes';

@Component({
  selector: 'app-pay-debt-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe],
  templateUrl: './pay-debt-modal.component.html',
  styleUrl: './pay-debt-modal.component.css'
})
export class PayDebtModalComponent implements OnChanges {
  @Input() show = false;
  @Input() transactionId = '';

  @Output() paid = new EventEmitter<void>();   // pembayaran berhasil dicatat
  @Output() closed = new EventEmitter<void>(); // modal ditutup tanpa membayar

  info: any = null;
  isLoading = false;
  loadError = '';

  payAmount = 0;
  payMethod = 'tunai';
  payNotes = '';
  payError = '';
  isSubmitting = false;

  constructor(
    private transactionService: TransactionService,
    private toastService: ToastService
  ) {}

  // Setiap kali modal dibuka (atau transaksinya berganti), muat data hutang terbaru
  ngOnChanges(changes: SimpleChanges) {
    if ((changes['show'] || changes['transactionId']) && this.show && this.transactionId) {
      this.loadInfo();
    }
  }

  private loadInfo() {
    this.isLoading = true;
    this.loadError = '';
    this.payError = '';
    this.info = null;

    this.transactionService.getDebtInfo(this.transactionId).subscribe({
      next: (res) => {
        this.info = res.data;
        this.payAmount = res.data.remaining; // default: bayar seluruh sisa
        this.payMethod = 'tunai';
        this.payNotes = '';
        this.isLoading = false;
      },
      error: (err) => {
        this.loadError = err?.error?.message || 'Gagal memuat data hutang';
        this.isLoading = false;
      }
    });
  }

  get canPay(): boolean {
    return !!this.info && this.info.remaining > 0 && this.info.status !== 'dibatalkan';
  }

  // Sisa hutang kalau nominal saat ini dibayarkan
  get remainingAfter(): number {
    return Math.max(0, (this.info?.remaining || 0) - (Number(this.payAmount) || 0));
  }

  payInFull() {
    if (this.info) this.payAmount = this.info.remaining;
  }

  submit() {
    if (!this.canPay || this.isSubmitting) return;

    const amount = Number(this.payAmount);
    if (!amount || amount <= 0) { this.payError = 'Nominal harus lebih dari 0'; return; }
    if (amount > this.info.remaining) { this.payError = 'Nominal melebihi sisa hutang'; return; }

    this.isSubmitting = true;
    this.payError = '';

    this.transactionService.payDebt(this.transactionId, {
      amountPaid: amount,
      paymentMethod: this.payMethod,
      notes: this.payNotes
    }).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        const sisa = res?.remainingDebt ?? 0;
        this.toastService.success(
          sisa > 0 ? 'Cicilan dicatat' : 'Hutang lunas',
          sisa > 0 ? `Sisa hutang Rp ${sisa.toLocaleString('id-ID')}` : `Transaksi ${this.info.invoiceNumber} sudah lunas`
        );
        this.paid.emit();
      },
      error: (err) => {
        this.payError = err?.error?.message || 'Terjadi kesalahan';
        this.isSubmitting = false;
      }
    });
  }

  close() {
    if (this.isSubmitting) return;
    this.closed.emit();
  }
}
