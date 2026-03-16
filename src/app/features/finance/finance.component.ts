import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/api.service';
import { RupiahPipe } from '../../shared/pipes';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe, NgClass, ConfirmDialogComponent, LoadingSpinnerComponent],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.css'
})
export class FinanceComponent implements OnInit {
  records: any[] = [];
  summary: any = null;
  isLoading = true;
  dateFrom = '';
  dateTo = '';
  selectedType = '';
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  selectedRecord: any = null;
  modalMode: 'add' | 'edit' = 'add';

  showModal = false;
  formType: 'income' | 'expense' = 'income';
  formCategory = '';
  formAmount = 0;
  formDescription = '';
  formDate = '';
  formError = '';
  formSubmitting = false;

  // Confirm dialog
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  incomeCategories = [
    { value: 'penjualan',     label: 'Penjualan' },
    { value: 'modal',         label: 'Modal' },
    { value: 'piutang_masuk', label: 'Piutang Masuk' },
    { value: 'pinjaman',      label: 'Pinjaman' },
    { value: 'lain_lain_masuk', label: 'Lain-lain' },
  ];
  expenseCategories = [
    { value: 'pembelian_stok',  label: 'Pembelian Stok' },
    { value: 'gaji',            label: 'Gaji' },
    { value: 'sewa',            label: 'Sewa' },
    { value: 'listrik',         label: 'Listrik' },
    { value: 'air',             label: 'Air' },
    { value: 'internet',        label: 'Internet' },
    { value: 'perawatan',       label: 'Perawatan' },
    { value: 'transportasi',    label: 'Transportasi' },
    { value: 'marketing',       label: 'Marketing' },
    { value: 'lain_lain_keluar', label: 'Lain-lain' },
  ];

  constructor(private financeService: FinanceService) {}

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    this.dateFrom = firstDay;
    this.dateTo = today;
    this.formDate = today;
    this.loadAll();
  }

  loadAll() {
    this.loadRecords();
    this.loadSummary();
  }

  loadRecords() {
    this.isLoading = true;
    const params: any = { page: this.currentPage, limit: 20 };
    if (this.dateFrom) params.startDate = this.dateFrom;
    if (this.dateTo) params.endDate = this.dateTo;
    if (this.selectedType) params.type = this.selectedType;

    this.financeService.getAll(params).subscribe({
      next: (res) => {
        this.records = res.data;
        this.totalItems = res.pagination?.total || res.data.length;
        this.totalPages = res.pagination?.pages || 1;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadSummary() {
    const params: any = {};
    if (this.dateFrom) params.startDate = this.dateFrom;
    if (this.dateTo) params.endDate = this.dateTo;

    this.financeService.getSummary(params).subscribe({
      next: (res) => { 
        console.log('summary:', res.data); // tambah ini
        this.summary = res.data; 
      }
    });
  }

  onFilter() { this.currentPage = 1; this.loadAll(); }

  resetFilter() {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    this.dateFrom = firstDay;
    this.dateTo = today;
    this.selectedType = '';
    this.currentPage = 1;
    this.loadAll();
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadRecords();
  }

  openModal(type: 'income' | 'expense') {
    this.formType = type;
    this.formCategory = '';
    this.formAmount = 0;
    this.formDescription = '';
    this.formDate = new Date().toISOString().split('T')[0];
    this.formError = '';
    this.showModal = true;
  }

  closeModal() { 
    this.showModal = false; 
    this.modalMode = 'add';
    this.selectedRecord = null;
  }

  get currentCategories(): { value: string, label: string }[] {
    return this.formType === 'income' ? this.incomeCategories : this.expenseCategories;
  }

  submitForm() {
    if (!this.formCategory) { this.formError = 'Kategori wajib dipilih'; return; }
    if (this.formAmount <= 0) { this.formError = 'Nominal harus lebih dari 0'; return; }

    this.formSubmitting = true;
    this.formError = '';

    const data = {
      type: this.formType === 'income' ? 'pemasukan' : 'pengeluaran',
      category: this.formCategory,
      amount: this.formAmount,
      description: this.formDescription || '-',
      date: this.formDate
    } as any;

    const req = this.modalMode === 'edit'
      ? this.financeService.update(this.selectedRecord._id, data)
      : this.financeService.create(data);

    req.subscribe({
      next: () => {
        this.showModal = false;
        this.formSubmitting = false;
        this.modalMode = 'add';
        this.selectedRecord = null;
        this.loadAll();
      },
      error: (err) => {
        this.formError = err?.error?.message || 'Terjadi kesalahan';
        this.formSubmitting = false;
      }
    })
  }

  deleteRecord(id: string) {
    this.confirmTitle = 'Hapus Catatan';
    this.confirmMessage = 'Apakah Anda yakin ingin menghapus catatan keuangan ini?';
    this.confirmAction = () => {
      this.financeService.delete(id).subscribe({
        next: () => { this.loadAll(); }
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

  getTypeClass(type: string): string {
    return type === 'pemasukan' ? 'badge-income' : 'badge-expense';
  }

  getTypeLabel(type: string): string {
    return type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran';
  }

  getCategoryLabel(value: string): string {
    const all = [...this.incomeCategories, ...this.expenseCategories];
    const found = all.find(c => c.value === value);
    return found ? found.label : value;
  }

  openEdit(record: any) {
    this.formType = record.type === 'pemasukan' ? 'income' : 'expense';
    this.formCategory = record.category;
    this.formAmount = record.amount;
    this.formDescription = record.description === '-' ? '' : record.description;
    this.formDate = new Date(record.date).toISOString().split('T')[0];
    this.formError = '';
    this.selectedRecord = record;
    this.modalMode = 'edit';
    this.showModal = true;
  }
}
