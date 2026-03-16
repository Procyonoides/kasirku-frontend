import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  @Input() show = false;
  @Input() title = 'Konfirmasi';
  @Input() message = 'Apakah Anda yakin?';
  @Input() confirmText = 'Ya, Lanjutkan';
  @Input() cancelText = 'Batal';
  @Input() type: 'danger' | 'warning' | 'primary' = 'danger';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() { this.confirmed.emit(); }
  onCancel()  { this.cancelled.emit(); }

}
