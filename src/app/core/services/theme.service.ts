import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      this.isDark.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  toggle() {
    const next = !this.isDark();
    this.isDark.set(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  }
}