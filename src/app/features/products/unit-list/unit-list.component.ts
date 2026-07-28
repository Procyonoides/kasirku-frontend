import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UnitService } from '../../../core/services/api.service';
import { Unit } from '../../../shared/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ConfirmDialogComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.css'
})
export class UnitListComponent implements OnInit {

  units: Unit[] = [];
  isLoading = true;

  // Modal
  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  selectedUnit: Unit | null = null;

  // Form
  formName = '';
  formDescription = '';
  formError = '';
  formSubmitting = false;

  // Confirm dialog
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor(
    private unitService: UnitService,
    private toastService: ToastService
  ) {}

  ngOnInit() { this.loadUnits(); }

  loadUnits() {
    this.isLoading = true;
    this.unitService.getAll().subscribe({
      next: (res) => { this.units = res.data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  openAdd() {
    this.modalMode = 'add';
    this.formName = '';
    this.formDescription = '';
    this.formError = '';
    this.selectedUnit = null;
    this.showModal = true;
  }

  openEdit(unit: Unit) {
    this.modalMode = 'edit';
    this.formName = unit.name;
    this.formDescription = unit.description || '';
    this.formError = '';
    this.selectedUnit = unit;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedUnit = null;
  }

  submitForm() {
    if (!this.formName.trim()) { this.formError = 'Nama satuan wajib diisi'; return; }
    this.formSubmitting = true;
    this.formError = '';

    const wasEdit = this.modalMode === 'edit';
    const data = { name: this.formName, description: this.formDescription };

    const req = this.modalMode === 'add'
      ? this.unitService.create(data)
      : this.unitService.update(this.selectedUnit!._id, data);

    req.subscribe({
      next: () => {
        this.showModal = false;
        this.formSubmitting = false;
        this.selectedUnit = null;
        this.loadUnits();
        this.toastService.success(
          wasEdit ? 'Satuan diperbarui' : 'Satuan ditambahkan',
          'Data satuan berhasil disimpan'
        );
      },
      error: (err) => {
        this.formError = err?.error?.message || 'Terjadi kesalahan';
        this.formSubmitting = false;
        this.toastService.error('Gagal menyimpan', err?.error?.message || 'Terjadi kesalahan');
      }
    });
  }

  deleteUnit(id: string, name: string) {
    this.confirmTitle = 'Hapus Satuan';
    this.confirmMessage = `Apakah Anda yakin ingin menghapus satuan "${name}"?`;
    this.confirmAction = () => {
      this.unitService.delete(id).subscribe({
        next: () => {
          this.loadUnits();
          this.toastService.success('Satuan dihapus', 'Satuan berhasil dihapus');
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

}
