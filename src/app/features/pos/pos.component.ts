import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, CustomerService, TransactionService } from '../../core/services/api.service';
import { Product, Customer } from '../../shared/models';
import { RupiahPipe } from '../../shared/pipes';

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe, NgClass],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css'
})
export class PosComponent implements OnInit {
  // Products
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: any[] = [];
  searchQuery = '';
  selectedCategory = '';
  isLoadingProducts = true;

  // Cart
  cart: CartItem[] = [];
  selectedCustomer: Customer | null = null;
  paymentMethod = 'tunai';
  discount = 0;
  amountPaid = 0;
  notes = '';

  // Customer search
  customerQuery = '';
  customerResults: Customer[] = [];
  isSearchingCustomer = false;

  // Checkout
  isSubmitting = false;
  showSuccess = false;
  lastInvoice = '';
  errorMsg = '';

  paymentMethods = [
    { value: 'tunai', label: 'Tunai', icon: 'bi-cash-coin' },
    { value: 'transfer', label: 'Transfer', icon: 'bi-bank' },
    { value: 'qris', label: 'QRIS', icon: 'bi-qr-code' },
    { value: 'kartu_debit', label: 'Kartu Debit', icon: 'bi-credit-card' },
    { value: 'hutang', label: 'Hutang', icon: 'bi-clock-history' },
  ];

  constructor(
    private productService: ProductService,
    private customerService: CustomerService,
    private transactionService: TransactionService,
    public router: Router
  ) {}

  ngOnInit() { this.loadProducts(); }

  loadProducts() {
    this.isLoadingProducts = true;
    this.productService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.products = res.data.filter((p: Product) => p.stock > 0);
        this.filteredProducts = this.products;
        const catMap = new Map();
        this.products.forEach(p => {
          if (p.category) catMap.set(p.category._id, p.category);
        });
        this.categories = Array.from(catMap.values());
        this.isLoadingProducts = false;
      },
      error: () => { this.isLoadingProducts = false; }
    });
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(p => {
      const matchSearch = !this.searchQuery ||
        p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchCat = !this.selectedCategory || p.category?._id === this.selectedCategory;
      return matchSearch && matchCat;
    });
  }

  addToCart(product: Product) {
    const existing = this.cart.find(i => i.product._id === product._id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      existing.quantity++;
      existing.subtotal = existing.quantity * product.sellPrice;
    } else {
      this.cart.push({ product, quantity: 1, subtotal: product.sellPrice });
    }
  }

  updateQty(item: CartItem, qty: number) {
    if (qty <= 0) { this.removeFromCart(item); return; }
    if (qty > item.product.stock) return;
    item.quantity = qty;
    item.subtotal = qty * item.product.sellPrice;
  }

  removeFromCart(item: CartItem) {
    this.cart = this.cart.filter(i => i.product._id !== item.product._id);
  }

  clearCart() {
    if (this.cart.length === 0) return;
    if (!confirm('Kosongkan keranjang?')) return;
    this.cart = [];
    this.selectedCustomer = null;
    this.discount = 0;
    this.amountPaid = 0;
  }

  get subtotal(): number {
    return this.cart.reduce((sum, i) => sum + i.subtotal, 0);
  }

  get grandTotal(): number {
    return Math.max(0, this.subtotal - this.discount);
  }

  get change(): number {
    return Math.max(0, this.amountPaid - this.grandTotal);
  }

  get isCartValid(): boolean {
    if (this.cart.length === 0) return false;
    if (this.paymentMethod === 'hutang' && !this.selectedCustomer) return false;
    if (this.paymentMethod === 'tunai' && this.amountPaid < this.grandTotal) return false;
    return true;
  }

  searchCustomer() {
    if (!this.customerQuery.trim()) { this.customerResults = []; return; }
    this.isSearchingCustomer = true;
    this.customerService.getAll({ search: this.customerQuery }).subscribe({
      next: (res) => { this.customerResults = res.data; this.isSearchingCustomer = false; },
      error: () => { this.isSearchingCustomer = false; }
    });
  }

  selectCustomer(c: Customer) {
    this.selectedCustomer = c;
    this.customerQuery = c.name;
    this.customerResults = [];
  }

  clearCustomer() {
    this.selectedCustomer = null;
    this.customerQuery = '';
    this.customerResults = [];
  }

  checkout() {
    if (!this.isCartValid) return;
    this.isSubmitting = true;
    this.errorMsg = '';

    const payload = {
      items: this.cart.map(i => ({
        productId: i.product._id,
        qty: i.quantity,
        price: i.product.sellPrice,
        subtotal: i.subtotal
      })),
      customerId: this.selectedCustomer?._id || null,
      paymentMethod: this.paymentMethod,
      discountPercent: this.subtotal > 0 ? (this.discount / this.subtotal) * 100 : 0,
      amountPaid: this.paymentMethod === 'tunai' ? this.amountPaid : this.grandTotal,
      notes: this.notes
    };

    this.transactionService.create(payload).subscribe({
      next: (res) => {
        this.lastInvoice = res.data?.invoiceNumber || '';
        this.showSuccess = true;
        this.isSubmitting = false;
        this.cart = [];
        this.selectedCustomer = null;
        this.discount = 0;
        this.amountPaid = 0;
        this.notes = '';
        this.loadProducts();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Transaksi gagal';
        this.isSubmitting = false;
      }
    });
  }

  closeSuccess() { this.showSuccess = false; }
}
