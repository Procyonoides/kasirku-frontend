import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'app-loading-spinner',
    imports: [],
    templateUrl: './loading-spinner.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './loading-spinner.component.css'
})
export class LoadingSpinnerComponent {
  @Input() message: string = 'Memuat data...';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}
