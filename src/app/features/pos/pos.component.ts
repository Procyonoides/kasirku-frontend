import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, CustomerService, TransactionService } from '../../core/services/api.service';
import { Product, Customer } from '../../shared/models';
import { RupiahPipe } from '../../shared/pipes';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReceiptService } from '../../core/services/receipt.service';
import { AuthService } from '../../core/auth/auth.service';

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  customPrice: number | null;
  isCustomPrice: boolean;
}

interface HeldCart {
  id: string;
  label: string;
  heldAt: string;
  cart: CartItem[];
  selectedCustomer: Customer | null;
  paymentMethod: string;
  discount: number;
  amountPaid: number;
  notes: string;
  pointsUsed: number;
  maxPoints: number;
  usePoints: boolean;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe, NgClass, ConfirmDialogComponent],
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
  pointsUsed = 0;
  maxPoints = 0;
  usePoints = false;

  // Custom price editing
  editingPriceItem: CartItem | null = null;
  tempCustomPrice: number | null = null;
  heldCarts: HeldCart[] = [];
  private holdCounter = 0;

  // Customer search
  customerQuery = '';
  customerResults: Customer[] = [];
  isSearchingCustomer = false;

  // Checkout
  isSubmitting = false;
  showSuccess = false;
  lastInvoice = '';
  errorMsg = '';

  // Confirm dialog
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  lastTransaction: any = null;

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
    private receiptService: ReceiptService,
    public authService: AuthService,
    public router: Router
  ) {}

  ngOnInit() { 
    this.loadProducts();
    this.loadHeldCarts();
  }

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
      existing.subtotal = existing.quantity * this.getPrice(existing);
    } else {
      this.cart.push({ product, quantity: 1, subtotal: product.sellPrice, customPrice: null, isCustomPrice: false });
    }
  }

  updateQty(item: CartItem, qty: number) {
    if (qty <= 0) { this.removeFromCart(item); return; }
    if (qty > item.product.stock) {
      qty = item.product.stock; // potong ke stok maksimal, jangan ditolak diam-diam
    }
    item.quantity = qty;
    item.subtotal = qty * this.getPrice(item);
  }

  removeFromCart(item: CartItem) {
    if (this.editingPriceItem === item) this.cancelEditPrice();
    this.cart = this.cart.filter(i => i.product._id !== item.product._id);
  }

  clearCart() {
    if (this.cart.length === 0) return;
    this.confirmTitle = 'Kosongkan Keranjang';
    this.confirmMessage = 'Apakah Anda yakin ingin mengosongkan keranjang belanja?';
    this.confirmAction = () => {
      this.resetCartState();
    };
    this.showConfirm = true;
  }

  // ── Tahan Transaksi (Park Cart) ──────────────────────────
  private buildHeldCart(): HeldCart {
    this.holdCounter++;
    return {
      id: `hold-${Date.now()}`,
      label: this.selectedCustomer ? this.selectedCustomer.name : `Antrian ${this.holdCounter}`,
      heldAt: new Date().toISOString(),
      cart: this.cart,
      selectedCustomer: this.selectedCustomer,
      paymentMethod: this.paymentMethod,
      discount: this.discount,
      amountPaid: this.amountPaid,
      notes: this.notes,
      pointsUsed: this.pointsUsed,
      maxPoints: this.maxPoints,
      usePoints: this.usePoints
    };
  }

  holdCurrentCart() {
    if (this.cart.length === 0) return;
    this.heldCarts.push(this.buildHeldCart());
    this.saveHeldCarts();
    this.resetCartState();
  }

  resumeHeldCart(held: HeldCart) {
    if (this.cart.length > 0) {
      // transaksi yang lagi jalan otomatis ikut ditahan, gak hilang
      this.heldCarts.push(this.buildHeldCart());
    }

    this.cart = held.cart;
    this.selectedCustomer = held.selectedCustomer;
    this.paymentMethod = held.paymentMethod;
    this.discount = held.discount;
    this.amountPaid = held.amountPaid;
    this.notes = held.notes;
    this.pointsUsed = held.pointsUsed;
    this.maxPoints = held.maxPoints;
    this.usePoints = held.usePoints;
    this.editingPriceItem = null;
    this.tempCustomPrice = null;
    this.customerQuery = held.selectedCustomer ? held.selectedCustomer.name : '';
    this.customerResults = [];

    this.heldCarts = this.heldCarts.filter(h => h.id !== held.id);
    this.saveHeldCarts();
  }

  deleteHeldCart(held: HeldCart, event: Event) {
    event.stopPropagation(); // biar gak ikut trigger resumeHeldCart
    this.heldCarts = this.heldCarts.filter(h => h.id !== held.id);
    this.saveHeldCarts();
  }

  heldCartTotal(held: HeldCart): number {
    return held.cart.reduce((s, i) => s + i.subtotal, 0);
  }

  heldCartItemCount(held: HeldCart): number {
    return held.cart.reduce((s, i) => s + i.quantity, 0);
  }

  private saveHeldCarts() {
    try {
      localStorage.setItem('kasirku_held_carts', JSON.stringify(this.heldCarts));
    } catch { /* localStorage penuh/diblokir, abaikan */ }
  }

  private loadHeldCarts() {
    try {
      const raw = localStorage.getItem('kasirku_held_carts');
      this.heldCarts = raw ? JSON.parse(raw) : [];
      this.holdCounter = this.heldCarts.length;
    } catch {
      this.heldCarts = [];
    }
  }

  private resetCartState() {
    this.cart = [];
    this.editingPriceItem = null;
    this.tempCustomPrice = null;
    this.selectedCustomer = null;
    this.customerQuery = '';
    this.customerResults = [];
    this.discount = 0;
    this.amountPaid = 0;
    this.notes = '';
    this.pointsUsed = 0;
    this.maxPoints = 0;
    this.usePoints = false;
  }

  startEditPrice(item: CartItem) {
    this.editingPriceItem = item;
    this.tempCustomPrice = this.getPrice(item);
  }

  confirmCustomPrice() {
    if (!this.editingPriceItem) return;
    const item = this.editingPriceItem;
    const price = Number(this.tempCustomPrice);

    if (isNaN(price) || price < 0) {
      this.cancelEditPrice();
      return;
    }

    if (price === item.product.sellPrice) {
      item.isCustomPrice = false;
      item.customPrice = null;
    } else {
      item.isCustomPrice = true;
      item.customPrice = price;
    }
    item.subtotal = item.quantity * this.getPrice(item);
    this.cancelEditPrice();
  }

  cancelEditPrice() {
    this.editingPriceItem = null;
    this.tempCustomPrice = null;
  }

  resetPrice(item: CartItem) {
    item.isCustomPrice = false;
    item.customPrice = null;
    item.subtotal = item.quantity * this.getPrice(item);
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

  get subtotal(): number {
    return this.cart.reduce((sum, i) => sum + i.subtotal, 0);
  }

  get pointsDiscount(): number {
    return this.pointsUsed * 100;
  }

  get grandTotal(): number {
    return Math.max(0, this.subtotal - this.discount - this.pointsDiscount);
  }

  get change(): number {
    return Math.max(0, this.amountPaid - this.grandTotal);
  }

  get quickCashOptions(): number[] {
    const total = this.grandTotal;
    if (total <= 0) return [];

    const denominations = [5000, 10000, 20000, 50000, 100000, 150000, 200000];
    const roundUp = (n: number, base: number) => Math.ceil(n / base) * base;

    const suggestions = new Set<number>();
    suggestions.add(total); // uang pas
    denominations.filter(d => d >= total).forEach(d => suggestions.add(d));
    suggestions.add(roundUp(total, 50000));
    suggestions.add(roundUp(total, 100000));

    return Array.from(suggestions).sort((a, b) => a - b).slice(0, 5);
  }

  setAmountPaid(value: number) {
    this.amountPaid = value;
  }

  get isCartValid(): boolean {
    if (this.cart.length === 0) return false;
    if (this.paymentMethod === 'hutang' && !this.selectedCustomer && !this.notes.trim()) return false;
    if (this.paymentMethod === 'tunai' && this.amountPaid < this.grandTotal) return false;
    return true;
  }

  getPrice(item: CartItem): number {
    return item.isCustomPrice && item.customPrice !== null ? item.customPrice : item.product.sellPrice;
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
    this.maxPoints = c.points || 0;
    this.pointsUsed = 0;
    this.usePoints = false;
  }

  clearCustomer() {
    this.selectedCustomer = null;
    this.customerQuery = '';
    this.customerResults = [];
    this.pointsUsed = 0;
    this.maxPoints = 0;
    this.usePoints = false;
  }

  validatePoints() {
    if (this.pointsUsed > this.maxPoints) {
      this.pointsUsed = this.maxPoints;
    }
    if (this.pointsUsed < 0) {
      this.pointsUsed = 0;
    }
  }

  checkout() {
    if (!this.isCartValid) return;
    this.isSubmitting = true;
    this.errorMsg = '';

    const isDebtWithoutCustomer = this.paymentMethod === 'hutang' && !this.selectedCustomer;
    const finalNotes = isDebtWithoutCustomer
      ? `[Hutang tanpa pelanggan terdaftar] ${this.notes.trim()}`
      : this.notes;

    const payload: any = {
      items: this.cart.map(i => {
        const base: any = {
          productId: i.product._id,
          qty: i.quantity,
          price: this.getPrice(i),
          subtotal: i.subtotal
        };
        if (i.isCustomPrice) base.customPrice = i.customPrice;
        return base;
      }),
      paymentMethod: this.paymentMethod,
      discountPercent: this.subtotal > 0 ? (this.discount / this.subtotal) * 100 : 0,
      amountPaid: this.paymentMethod === 'tunai' ? this.amountPaid : this.grandTotal,
      notes: finalNotes,
      pointsUsed: this.pointsUsed
    };
    if (this.selectedCustomer?._id) {
      payload.customerId = this.selectedCustomer._id;
    }

    this.transactionService.create(payload).subscribe({
      next: (res) => {
        this.lastInvoice = res.data?.invoiceNumber || '';
        this.showSuccess = true;
        this.lastTransaction = res.data;
        this.isSubmitting = false;
        this.resetCartState();
        this.loadProducts();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Transaksi gagal';
        this.isSubmitting = false;
      }
    });
  }

  printReceipt() {
    if (!this.lastTransaction) return;
    const tx = {
      ...this.lastTransaction,
      cashier: { name: this.authService.currentUser()?.name || '-' }
    };
    this.receiptService.printReceipt(tx);
  }

  onQtyChange(item: CartItem, event: Event) {
    const input = event.target as HTMLInputElement;
    this.updateQty(item, +input.value);
    // Paksa sinkron tampilan kotak input ke nilai final,
    // karena binding [value] Angular gak re-render kalau
    // item.quantity kebetulan sama dengan sebelumnya (misal
    // sama-sama ke-clamp ke 50 dua kali berturut-turut)
    input.value = String(item.quantity);
  }

  closeSuccess() { this.showSuccess = false; }
}