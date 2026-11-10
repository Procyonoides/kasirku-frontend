import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RupiahPipe } from '../../../shared/pipes';

@Component({
    selector: 'app-sales',
    imports: [CommonModule, RupiahPipe],
    templateUrl: './sales.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './sales.component.css'
})
export class SalesComponent {
  @Input() data: any[] = [];

  getTotalRevenue(): number {
    if (!this.data.length) return 0;
    return this.data.reduce((sum, row) => sum + row.revenue, 0);
  }

  getTotalTransactions(): number {
    if (!this.data.length) return 0;
    return this.data.reduce((sum, row) => sum + row.transactions, 0);
  }

  getAvgPerTransaction(): number {
    const tx = this.getTotalTransactions();
    return tx > 0 ? Math.round(this.getTotalRevenue() / tx) : 0;
  }

  getMaxRevenue(): number {
    if (!this.data.length) return 1;
    return Math.max(...this.data.map(r => r.revenue));
  }
}
