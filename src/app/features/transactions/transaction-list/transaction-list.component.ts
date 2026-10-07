import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransactionService, CategoryService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Transaction } from '../../../shared/models';
import { RupiahPipe } from '../../../shared/pipes';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { PayDebtModalComponent } from '../../../shared/components/pay-debt-modal/pay-debt-modal.component';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink, FormsModule, RupiahPipe, ConfirmDialogComponent, LoadingSpinnerComponent, PaginationComponent, PayDebtModalComponent],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.css'
})
export class TransactionListComponent implements OnInit {
  transactions: Transaction[] = [];
  isLoading = true;
  dateFrom = '';
  dateTo = '';
  selectedStatus = '';
  productQuery = '';
  searchText = '';
  debtSummary: any = null;
  activeProduct = '';
  categories: any[] = [];
  selectedCategory = '';
  activeCategoryName = '';
  productSummary: any = null;
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  totalItems = 0;

  // Bayar hutang
  showPayDebt = false;
  payDebtTxId = '';

  // Confirm dialog
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.dateFrom = today;
    this.dateTo = today;
    this.loadCategories();
    this.loadTransactions();
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (res) => { this.categories = res.data; }
    });
  }

  // Judul kotak ringkasan, mis. "aqua" di kategori Minuman
  get summaryTitle(): string {
    const parts: string[] = [];
    if (this.activeProduct) parts.push(`"${this.activeProduct}"`);
    if (this.activeCategoryName) parts.push(`kategori ${this.activeCategoryName}`);
    return parts.join(' di ');
  }

  loadTransactions() {
    this.isLoading = true;
    const params: any = { page: this.currentPage, limit: this.pageSize };
    if (this.dateFrom) params.startDate = this.dateFrom;
    if (this.dateTo) params.endDate = this.dateTo;
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.productQuery.trim()) params.product = this.productQuery.trim();
    if (this.searchText.trim()) params.search = this.searchText.trim();
    if (this.selectedStatus === 'hutang') params.sort = 'oldest';
    if (this.selectedCategory) params.category = this.selectedCategory;

    this.transactionService.getAll(params).subscribe({
      next: (res: any) => {
        this.transactions = res.data;
        this.productSummary = res.productSummary || null;
        this.debtSummary = res.debtSummary || null;
        this.activeProduct = params.product || '';
        this.activeCategoryName = this.categories.find(c => c._id === params.category)?.name || '';
        this.totalItems = res.pagination?.total || res.data.length;
        this.totalPages = res.pagination?.pages || 1;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onFilter() { this.currentPage = 1; this.loadTransactions(); }

  resetFilter() {
    const today = new Date().toISOString().split('T')[0];
    this.dateFrom = today;
    this.dateTo = today;
    this.selectedStatus = '';
    this.productQuery = '';
    this.searchText = '';
    this.selectedCategory = '';
    this.currentPage = 1;
    this.loadTransactions();
  }

  // Tampilkan semua hutang (terdaftar maupun tanpa nama), tanpa batas tanggal
  showDebtOnly() {
    this.selectedStatus = 'hutang';
    this.dateFrom = '';
    this.dateTo = '';
    this.productQuery = '';
    this.searchText = '';
    this.selectedCategory = '';
    this.currentPage = 1;
    this.loadTransactions();
  }

  openPayDebt(tx: Transaction) {
    this.payDebtTxId = tx._id;
    this.showPayDebt = true;
  }

  closePayDebt() {
    this.showPayDebt = false;
  }

  onDebtPaid() {
    this.showPayDebt = false;
    this.loadTransactions();
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadTransactions();
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadTransactions();
  }

  cancelTransaction(id: string, invoice: string) {
    this.confirmTitle = 'Batalkan Transaksi';
    this.confirmMessage = `Apakah Anda yakin ingin membatalkan transaksi ${invoice}? Stok produk akan dikembalikan.`;
    this.confirmAction = () => {
      this.transactionService.cancel(id).subscribe({
        next: () => { this.loadTransactions(); },
        error: (err) => {
          this.toastService.error('Gagal membatalkan', err?.error?.message || 'Terjadi kesalahan');
        }
      });
    };
    this.showConfirm = true;
  }

  // Hapus permanen — hanya untuk owner, dan hanya transaksi yang
  // statusnya sudah 'dibatalkan' (backend juga memvalidasi ini).
  deleteTransaction(id: string, invoice: string) {
    this.confirmTitle = 'Hapus Transaksi Permanen';
    this.confirmMessage = `Transaksi ${invoice} akan DIHAPUS PERMANEN dan tidak bisa dikembalikan lagi. Yakin?`;
    this.confirmAction = () => {
      this.transactionService.delete(id).subscribe({
        next: () => {
          this.loadTransactions();
          this.toastService.success('Transaksi dihapus', `Transaksi ${invoice} berhasil dihapus permanen`);
        },
        error: (err) => {
          this.toastService.error('Gagal menghapus', err?.error?.message || 'Terjadi kesalahan');
        }
      });
    };
    this.showConfirm = true;
  }

  onConfirmed() {
    if (this.confirmAction) this.confirmAction();
    this.showConfirm = false;
    this.confirmAction = null;
  }

  onCancelled() {
    this.showConfirm = false;
    this.confirmAction = null;
  }

  getDebtRemaining(tx: any): number {
    return tx?.debtRemaining ?? 0;
  }

  // Catatan hutang tanpa awalan teknis "[Hutang tanpa pelanggan terdaftar]"
  getDebtNote(tx: any): string {
    return (tx?.notes || '').replace('[Hutang tanpa pelanggan terdaftar]', '').trim();
  }

  // Ringkasan barang, mis. "Aqua ×2, Chitato ×1 +3 lainnya"
  getItemsSummary(tx: any): string {
    const items: any[] = tx?.items || [];
    const first = items.slice(0, 2).map(i => `${i.productName} ×${i.qty}`).join(', ');
    return items.length > 2 ? `${first} +${items.length - 2} lainnya` : first;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      selesai: 'badge-selesai',
      hutang: 'badge-hutang',
      dibatalkan: 'badge-batal'
    };
    return map[status] || 'bg-secondary';
  }

  getPaymentIcon(method: string): string {
    const map: Record<string, string> = {
      tunai: 'bi-cash-coin',
      transfer: 'bi-bank',
      qris: 'bi-qr-code',
      hutang: 'bi-clock-history',
      kartu_debit: 'bi-credit-card',
      kartu_kredit: 'bi-credit-card-2-front'
    };
    return map[method] || 'bi-cash';
  }

  getTotalRevenue(): number {
    return this.transactions
      .filter(t => t.status === 'selesai')
      .reduce((sum, t) => sum + t.grandTotal, 0);
  }
}