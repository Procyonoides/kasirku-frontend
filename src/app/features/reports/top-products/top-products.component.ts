import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { RupiahPipe } from '../../../shared/pipes';

@Component({
    selector: 'app-top-products',
    imports: [RupiahPipe],
    templateUrl: './top-products.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './top-products.component.css'
})
export class TopProductsComponent {
  @Input() data: any[] = [];

  getMaxQty(): number {
    if (!this.data.length) return 1;
    return Math.max(...this.data.map(p => p.totalQty ?? p.totalQuantity ?? 0));
  }
}
