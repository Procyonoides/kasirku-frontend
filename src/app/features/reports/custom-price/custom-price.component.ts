import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RupiahPipe } from '../../../shared/pipes';

@Component({
    selector: 'app-custom-price',
    imports: [CommonModule, RupiahPipe],
    templateUrl: './custom-price.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './custom-price.component.css'
})
export class CustomPriceComponent {
  @Input() data: { items: any[]; totalSelisih: number; count: number } | null = null;

  selisihSign(value: number): string {
    return value > 0 ? '-' : (value < 0 ? '+' : '');
  }

  selisihAbs(value: number): number {
    return Math.abs(value);
  }

}
