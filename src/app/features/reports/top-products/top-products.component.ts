import { Component,Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RupiahPipe } from '../../../shared/pipes';

@Component({
  selector: 'app-top-products',
  standalone: true,
  imports: [CommonModule, RupiahPipe],
  templateUrl: './top-products.component.html',
  styleUrl: './top-products.component.css'
})
export class TopProductsComponent {
  @Input() data: any[] = [];

  getMaxQty(): number {
    if (!this.data.length) return 1;
    return Math.max(...this.data.map(p => p.totalQty ?? p.totalQuantity ?? 0));
  }
}
