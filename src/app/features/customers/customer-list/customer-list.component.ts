import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../core/services/api.service';
import { Customer } from '../../../shared/models';
import { RupiahPipe } from '../../../shared/pipes';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink, FormsModule, RupiahPipe, ConfirmDialogComponent, LoadingSpinnerComponent],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css'
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  isLoading = true;
  searchQuery = '';
  filterDebt = false;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  selectedCustomer: Customer | null = null;

  // Form fields
  formName = '';
  formPhone = '';
  formAddress = '';
  formError = '';
  formSubmitting = false;

  // Confirm dialog
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor(
    private customerService: CustomerService,
    private toastService: ToastService
  ) {}

  ngOnInit() { this.loadCustomers(); }

  loadCustomers() {
    this.isLoading = true;
    const params: any = { page: this.currentPage, limit: 20 };
    if (this.searchQuery) params.search = this.searchQuery;

    const req = this.filterDebt
      ? this.customerService.getDebtors()
      : this.customerService.getAll(params);

    req.subscribe({
      next: (res) => {
        this.customers = res.data;
        this.totalItems = res.pagination?.total || res.data.length;
        this.totalPages = res.pagination?.pages || 1;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearch() { this.currentPage = 1; this.loadCustomers(); }

  toggleDebtFilter() {
    this.filterDebt = !this.filterDebt;
    this.currentPage = 1;
    this.loadCustomers();
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadCustomers();
  }

  openAdd() {
    this.modalMode = 'add';
    this.formName = '';
    this.formPhone = '';
    this.formAddress = '';
    this.formError = '';
    this.selectedCustomer = null;
    this.showModal = true;
  }

  openEdit(customer: Customer) {
    this.modalMode = 'edit';
    this.formName = customer.name;
    this.formPhone = customer.phone || '';
    this.formAddress = customer.address || '';
    this.formError = '';
    this.selectedCustomer = customer;
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  submitForm() {
    if (!this.formName.trim()) { this.formError = 'Nama pelanggan wajib diisi'; return; }
    this.formSubmitting = true;
    this.formError = '';

    const wasEdit = this.modalMode === 'edit';
    const data = { name: this.formName, phone: this.formPhone, address: this.formAddress };

    const req = this.modalMode === 'add'
      ? this.customerService.create(data)
      : this.customerService.update(this.selectedCustomer!._id, data);

    req.subscribe({
      next: () => {
        this.showModal = false;
        this.formSubmitting = false;
        this.loadCustomers();
        this.toastService.success(
          wasEdit ? 'Pelanggan diperbarui' : 'Pelanggan ditambahkan',
          'Data pelanggan berhasil disimpan'
        );
      },
      error: (err) => {
        this.formError = err?.error?.message || 'Terjadi kesalahan';
        this.formSubmitting = false;
        this.toastService.error('Gagal menyimpan', err?.error?.message || 'Terjadi kesalahan');
      }
    });
  }

  deleteCustomer(id: string, name: string) {
    this.confirmTitle = 'Hapus Pelanggan';
    this.confirmMessage = `Apakah Anda yakin ingin menghapus pelanggan "${name}"?`;
    this.confirmAction = () => {
      this.customerService.delete(id).subscribe({
        next: () => { this.loadCustomers(); }
      });
    };
    this.showConfirm = true;
  }

  onConfirmed() {
    if (this.confirmAction) this.confirmAction();
    this.showConfirm = false;
    this.confirmAction = null;
    this.toastService.success('Pelanggan dihapus', 'Pelanggan berhasil dihapus');
  }

  onCancelled() {
    this.showConfirm = false;
    this.confirmAction = null;
  }

  getTierBadge(tier: string): string {
    const map: Record<string, string> = {
      regular: 'bg-secondary',
      silver: 'badge-silver',
      gold: 'badge-gold',
      platinum: 'badge-platinum'
    };
    return map[tier] || 'bg-secondary';
  }
}
