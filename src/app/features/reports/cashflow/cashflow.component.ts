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
}
