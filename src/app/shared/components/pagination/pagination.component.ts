import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 20;
  @Input() pageSizeOptions: number[] = [10, 20, 50, 100];
  @Input() itemLabel = 'data';

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get startItem(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  // Daftar nomor halaman. -1 = titik-titik (…)
  // Contoh (halaman 8 dari 20): 1 … 6 7 8 9 10 … 20
  get pages(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    const delta = 2;
    const result: number[] = [];
    let last = 0;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= cur - delta && i <= cur + delta)) {
        if (last) {
          if (i - last === 2) result.push(last + 1);
          else if (i - last > 2) result.push(-1);
        }
        result.push(i);
        last = i;
      }
    }
    return result;
  }

  go(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }

  onSizeChange(value: string) {
    this.pageSizeChange.emit(Number(value));
  }
}
