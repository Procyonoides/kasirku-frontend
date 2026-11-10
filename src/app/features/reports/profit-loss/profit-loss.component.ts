import { Component, Input } from '@angular/core';

import { RupiahPipe } from '../../../shared/pipes';

@Component({
    selector: 'app-profit-loss',
    imports: [RupiahPipe],
    templateUrl: './profit-loss.component.html',
    styleUrl: './profit-loss.component.css'
})
export class ProfitLossComponent{
  @Input() data: any = null;

  getProfitMargin(): string {
    if (!this.data || this.data.revenue <= 0) return '0';
    return ((this.data.netProfit / this.data.revenue) * 100).toFixed(1);
  }
}
