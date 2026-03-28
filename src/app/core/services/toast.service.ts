import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  private add(type: Toast['type'], title: string, message?: string, duration = 3000) {
    const id = ++this.counter;
    this.toasts.update(list => [...list, { id, type, title, message, duration }]);
    setTimeout(() => this.remove(id), duration);
  }

  success(title: string, message?: string) { this.add('success', title, message); }
  error(title: string, message?: string)   { this.add('error', title, message, 4000); }
  warning(title: string, message?: string) { this.add('warning', title, message); }
  info(title: string, message?: string)    { this.add('info', title, message); }

  remove(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}