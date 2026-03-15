import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TransactionService } from '../../../core/services/api.service';
import { RupiahPipe } from '../../../shared/pipes';


@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink, RupiahPipe],
  templateUrl: './transaction-detail.component.html',
  styleUrl: './transaction-detail.component.css'
})
export class TransactionDetailComponent implements OnInit {
  transaction: any = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.transactionService.getOne(id).subscribe({
      next: (res) => { this.transaction = res.data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
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

}
