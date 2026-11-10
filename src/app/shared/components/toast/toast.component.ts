import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
    selector: 'app-toast',
    imports: [],
    templateUrl: './toast.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './toast.component.css'
})
export class ToastComponent {
  toastService = inject(ToastService);

  getIcon(type: Toast['type']): string {
    const map: Record<string, string> = {
      success: 'bi-check-circle-fill',
      error:   'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info:    'bi-info-circle-fill'
    };
    return map[type] || 'bi-info-circle-fill';
  }
}
