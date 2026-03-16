import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../core/services/api.service';
import { Category } from '../../../shared/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent, LoadingSpinnerComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css'
})
export class CategoryListComponent implements OnInit {

  categories: Category[] = [];
  isLoading = true;

  // Modal
  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  selectedCategory: Category | null = null;

  // Form
  formName = '';
  formColor = '#3B82F6';
  formError = '';
  formSubmitting = false;

  // Confirm dialog
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor(private categoryService: CategoryService) {}

  ngOnInit() { this.loadCategories(); }

  loadCategories() {
    this.isLoading = true;
    this.categoryService.getAll().subscribe({
      next: (res) => { this.categories = res.data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  openAdd() {
    this.modalMode = 'add';
    this.formName = '';
    this.formColor = '#3B82F6';
    this.formError = '';
    this.selectedCategory = null;
    this.showModal = true;
  }

  openEdit(cat: Category) {
    this.modalMode = 'edit';
    this.formName = cat.name;
    this.formColor = cat.color;
    this.formError = '';
    this.selectedCategory = cat;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedCategory = null;
  }

  submitForm() {
    if (!this.formName.trim()) { this.formError = 'Nama kategori wajib diisi'; return; }
    this.formSubmitting = true;
    this.formError = '';

    const data = { name: this.formName, color: this.formColor };

    const req = this.modalMode === 'add'
      ? this.categoryService.create(data)
      : this.categoryService.update(this.selectedCategory!._id, data);

    req.subscribe({
      next: () => { this.showModal = false; this.formSubmitting = false; this.loadCategories(); },
      error: (err) => { this.formError = err?.error?.message || 'Terjadi kesalahan'; this.formSubmitting = false; }
    });
  }

  deleteCategory(id: string, name: string) {
    this.confirmTitle = 'Hapus Kategori';
    this.confirmMessage = `Apakah Anda yakin ingin menghapus kategori "${name}"?`;
    this.confirmAction = () => {
      this.categoryService.delete(id).subscribe({
        next: () => { this.loadCategories(); }
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
