import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RupiahPipe } from '../../../shared/pipes';

@Component({
  selector: 'app-cashflow',
  standalone: true,
  imports: [CommonModule, RupiahPipe],
  templateUrl: './cashflow.component.html',
  styleUrl: './cashflow.component.css'
})
export class CashflowComponent {
  @Input() data: any = null;

  expandedDay: string | null = null;

  toggleExpand(day: string) {
    this.expandedDay = this.expandedDay === day ? null : day;
  }

  getCategoryLabel(value: string): string {
    const map: Record<string, string> = {
      'penjualan': 'Penjualan', 'modal': 'Modal', 'piutang_masuk': 'Piutang Masuk',
      'pinjaman': 'Pinjaman', 'lain_lain_masuk': 'Lain-lain',
      'pembelian_stok': 'Pembelian Stok', 'gaji': 'Gaji', 'sewa': 'Sewa',
      'listrik': 'Listrik', 'air': 'Air', 'internet': 'Internet',
      'perawatan': 'Perawatan', 'transportasi': 'Transportasi',
      'marketing': 'Marketing', 'lain_lain_keluar': 'Lain-lain'
    };
    return map[value] || value;
  }
}
