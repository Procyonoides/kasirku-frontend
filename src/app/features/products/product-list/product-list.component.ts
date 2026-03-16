import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, CategoryService } from '../../../core/services/api.service';
import { Product, Category } from '../../../shared/models';
import { RupiahPipe } from '../../../shared/pipes';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink, FormsModule, RupiahPipe, ConfirmDialogComponent, LoadingSpinnerComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  isLoading = true;
  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;

  // Confirm dialog
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (res) => { this.categories = res.data; }
    });
  }

  loadProducts() {
    this.isLoading = true;
    const params: any = { page: this.currentPage, limit: 20 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedCategory) params.category = this.selectedCategory;
    if (this.selectedStatus) params.status = this.selectedStatus;

    this.productService.getAll(params).subscribe({
      next: (res) => {
        this.products = res.data;
        this.totalItems = res.pagination?.total || 0;
        this.totalPages = res.pagination?.pages || 1;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadProducts();
  }

  onFilter() {
    this.currentPage = 1;
    this.loadProducts();
  }

  resetFilter() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadProducts();
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
  }

  deleteProduct(id: string, name: string) {
    this.confirmTitle = 'Hapus Produk';
    this.confirmMessage = `Apakah Anda yakin ingin menghapus produk "${name}"?`;
    this.confirmAction = () => {
      this.productService.delete(id).subscribe({
        next: () => { this.loadProducts(); }
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

  getStockBadge(product: Product): string {
    if (product.stock === 0) return 'bg-danger';
    if (product.stock <= product.minStock) return 'bg-warning text-dark';
    return 'bg-success';
  }

  getStockLabel(product: Product): string {
    if (product.stock === 0) return 'Habis';
    if (product.stock <= product.minStock) return 'Menipis';
    return 'Aman';
  }
}
