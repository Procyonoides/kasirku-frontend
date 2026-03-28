import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService, CategoryService } from '../../../core/services/api.service';
import { Category } from '../../../shared/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {
  form!: FormGroup;
  categories: Category[] = [];
  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  productId = '';
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.buildForm();
    this.loadCategories();

    this.productId = this.route.snapshot.params['id'];
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct();
    }
  }

  buildForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      sku: [''],
      barcode: [''],
      category: ['', Validators.required],
      unit: ['pcs', Validators.required],
      buyPrice: [0, [Validators.required, Validators.min(0)]],
      sellPrice: [0, [Validators.required, Validators.min(1)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      minStock: [5, [Validators.required, Validators.min(0)]],
      description: ['']
    });
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (res) => { this.categories = res.data; }
    });
  }

  loadProduct() {
    this.isLoading = true;
    this.productService.getById(this.productId).subscribe({
      next: (res) => {
        const p = res.data;
        this.form.patchValue({
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          category: p.category?._id || p.category,
          unit: p.unit,
          buyPrice: p.buyPrice,
          sellPrice: p.sellPrice,
          stock: p.stock,
          minStock: p.minStock,
          description: p.description
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/products']);
      }
    });
  }

  get profit(): number {
    const buy = this.form.get('buyPrice')?.value || 0;
    const sell = this.form.get('sellPrice')?.value || 0;
    return sell - buy;
  }

  get profitPercent(): number {
    const buy = this.form.get('buyPrice')?.value || 0;
    if (buy === 0) return 0;
    return Math.round((this.profit / buy) * 100);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMsg = '';

    const action = this.isEditMode
      ? this.productService.update(this.productId, this.form.value)
      : this.productService.create(this.form.value);

    action.subscribe({
      next: () => {
        this.toastService.success(
          this.isEditMode ? 'Produk diperbarui' : 'Produk ditambahkan',
          'Data produk berhasil disimpan'
        );
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Terjadi kesalahan';
        this.isSubmitting = false;
        this.toastService.error('Gagal menyimpan', this.errorMsg);
      }
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
