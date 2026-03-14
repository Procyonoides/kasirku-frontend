import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'rupiah', standalone: true })
export class RupiahPipe implements PipeTransform {
  transform(value: number | string | null | undefined, showSymbol = true): string {
    if (value === null || value === undefined) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    const formatted = new Intl.NumberFormat('id-ID').format(num);
    return showSymbol ? `Rp ${formatted}` : formatted;
  }
}

@Pipe({ name: 'stockStatus', standalone: true })
export class StockStatusPipe implements PipeTransform {
  transform(status: string): string {
    const map: Record<string, string> = {
      aman: 'Aman',
      menipis: 'Menipis',
      habis: 'Habis'
    };
    return map[status] || status;
  }
}

@Pipe({ name: 'customerTier', standalone: true })
export class CustomerTierPipe implements PipeTransform {
  transform(tier: string): string {
    const map: Record<string, string> = {
      regular: 'Regular',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum'
    };
    return map[tier] || tier;
  }
}