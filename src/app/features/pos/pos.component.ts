import { Component, OnInit, AfterViewInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, CustomerService, TransactionService, CategoryService } from '../../core/services/api.service';
import { Subscription } from 'rxjs';
import { Product, Customer } from '../../shared/models';
import { RupiahPipe } from '../../shared/pipes';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReceiptService } from '../../core/services/receipt.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

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
  downPayment?: number;
  downPaymentMethod?: string;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, RupiahPipe, NgClass, ConfirmDialogComponent],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css'
})
export class PosComponent implements OnInit, AfterViewInit, OnDestroy {
  // Products
  filteredProducts: Product[] = [];
  categories: any[] = [];
  searchQuery = '';
  selectedCategory = '';
  isLoadingProducts = true;

  // Paginasi produk (diproses di server)
  readonly pageSize = 30;
  productPage = 1;
  totalProducts = 0;
  hasMoreProducts = false;
  isLoadingMore = false;
  private productSub?: Subscription;
  private searchTimer: any;
  private observer?: IntersectionObserver;

  // Cart
  cart: CartItem[] = [];
  selectedCustomer: Customer | null = null;
  paymentMethod = 'tunai';
  discount = 0;
  amountPaid = 0;
  downPayment = 0;
  downPaymentMethod = 'tunai';
  keepChangeAmount = 0;
  notes = '';
  pointsUsed = 0;
  maxPoints = 0;
  usePoints = false;

  // Custom price editing
  editingPriceItem: CartItem | null = null;
  tempCustomPrice: number | null = null;
  @ViewChild('searchInputRef') searchInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('productGridRef') productGridRef?: ElementRef<HTMLElement>;
  @ViewChild('sentinelRef') sentinelRef?: ElementRef<HTMLElement>;
  @ViewChild('customerInputRef') customerInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('discountInputRef') discountInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('amountPaidInputRef') amountPaidInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('notesInputRef') notesInputRef?: ElementRef<HTMLTextAreaElement>;
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

  // Metode untuk uang muka: sama seperti pembayaran biasa, tanpa Hutang
  get downPaymentMethods() {
    return this.paymentMethods.filter(pm => pm.value !== 'hutang');
  }

  constructor(
    private productService: ProductService,
    private customerService: CustomerService,
    private transactionService: TransactionService,
    private receiptService: ReceiptService,
    public authService: AuthService,
    public router: Router,
    private categoryService: CategoryService,
    private toastService: ToastService,
  ) {}

  ngOnInit() { 
    this.loadProducts();
    this.loadHeldCarts();
    this.loadCategories();
  }

  // Pantau penanda di dasar grid: begitu hampir terlihat, muat produk berikutnya
  ngAfterViewInit() {
    if (!this.sentinelRef || !this.productGridRef) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) this.loadMoreProducts();
      },
      { root: this.productGridRef.nativeElement, rootMargin: '0px 0px 300px 0px' }
    );
    this.observer.observe(this.sentinelRef.nativeElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.productSub?.unsubscribe();
    clearTimeout(this.searchTimer);
  }

  // Dipanggil setelah produk selesai dimuat: kalau penanda masih terlihat
  // (layar besar / produk belum memenuhi layar), langsung muat halaman berikutnya
  private recheckSentinel() {
    setTimeout(() => {
      const el = this.sentinelRef?.nativeElement;
      if (!this.observer || !el) return;
      this.observer.unobserve(el);
      this.observer.observe(el);
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    // Esc buat batal edit harga custom
    if (event.key === 'Escape' && this.editingPriceItem) {
      event.preventDefault();
      this.cancelEditPrice();
      return;
    }

    // Shortcut lain gak boleh aktif kalau lagi edit harga
    if (this.editingPriceItem) return;

    switch (event.key) {
      case 'F2':
        event.preventDefault();
        this.searchInputRef?.nativeElement.focus();
        this.searchInputRef?.nativeElement.select();
        break;

      case 'F3':
        event.preventDefault();
        this.customerInputRef?.nativeElement.focus();
        break;

      case 'F4':
        event.preventDefault();
        this.holdCurrentCart();
        break;

      case 'F5':
        event.preventDefault();
        this.clearCart();
        break;

      case 'F6':
        event.preventDefault();
        this.discountInputRef?.nativeElement.focus();
        this.discountInputRef?.nativeElement.select();
        break;

      case 'F7':
        event.preventDefault();
        if (this.paymentMethod === 'tunai') {
          this.amountPaidInputRef?.nativeElement.focus();
          this.amountPaidInputRef?.nativeElement.select();
        }
        break;

      case 'F8':
        event.preventDefault();
        this.notesInputRef?.nativeElement.focus();
        break;

      case 'F9':
        event.preventDefault();
        if (this.isCartValid && !this.isSubmitting) {
          this.checkout();
        }
        break;
    }
  }

  loadCategories() {
    this.categoryService.getAll().subscribe({
      next: (res) => { this.categories = res.data; }
    });
  }

  // Ambil produk dari server. reset=true -> mulai dari halaman 1, false -> tambah halaman berikutnya
  loadProducts(reset = true) {
    if (reset) {
      this.productPage = 1;
      this.isLoadingProducts = true;
      this.isLoadingMore = false;
    } else {
      this.isLoadingMore = true;
    }

    // Tab Terlaris: ambil dari endpoint khusus (satu daftar saja, tanpa halaman berikutnya)
    if (this.selectedCategory === 'terlaris') {
      this.productSub?.unsubscribe();
      this.productSub = this.productService.getTopSelling(this.pageSize).subscribe({
        next: (res: any) => {
          this.filteredProducts = res.data;
          this.totalProducts = res.data.length;
          this.hasMoreProducts = false;
          this.isLoadingProducts = false;
          this.isLoadingMore = false;
        },
        error: () => {
          this.isLoadingProducts = false;
          this.isLoadingMore = false;
        }
      });
      return;
    }

    const params: any = {
      page: this.productPage,
      limit: this.pageSize,
      inStock: 'true'
    };
    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();
    if (this.selectedCategory) params.category = this.selectedCategory;

    this.productSub?.unsubscribe(); // batalkan request lama supaya hasilnya tidak tertimpa
    this.productSub = this.productService.getAll(params).subscribe({
      next: (res: any) => {
        this.filteredProducts = reset ? res.data : [...this.filteredProducts, ...res.data];
        this.totalProducts = res.pagination?.total ?? this.filteredProducts.length;
        this.hasMoreProducts = this.productPage < (res.pagination?.pages ?? 1);
        this.isLoadingProducts = false;
        this.isLoadingMore = false;
        this.recheckSentinel();
      },
      error: () => {
        this.isLoadingProducts = false;
        this.isLoadingMore = false;
      }
    });
  }

  // Muat ulang produk yang sudah tampil (mis. setelah checkout, untuk menyegarkan stok)
  // tanpa spinner dan tanpa kembali ke atas
  refreshProducts() {
    if (this.selectedCategory === 'terlaris') {
      this.productService.getTopSelling(this.pageSize).subscribe({
        next: (res: any) => {
          this.filteredProducts = res.data;
          this.totalProducts = res.data.length;
        }
      });
      return;
    }

    const loadedCount = this.filteredProducts.length;
    const params: any = {
      page: 1,
      limit: Math.max(loadedCount, this.pageSize), // ambil sekaligus sebanyak yang sudah tampil
      inStock: 'true'
    };
    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();
    if (this.selectedCategory) params.category = this.selectedCategory;

    this.productSub?.unsubscribe();
    this.productSub = this.productService.getAll(params).subscribe({
      next: (res: any) => {
        const total = res.pagination?.total ?? res.data.length;
        const allLoaded = res.data.length >= total;

        // Ada produk yang stoknya habis: urutan halaman bergeser, jadi muat ulang dari awal saja
        if (!allLoaded && res.data.length !== loadedCount) {
          this.loadProducts();
          return;
        }

        this.filteredProducts = res.data;
        this.totalProducts = total;
        this.hasMoreProducts = !allLoaded;
      }
    });
  }

  // Dipakai ngFor: kartu produk yang sama dipakai ulang saat daftar disegarkan (posisi scroll terjaga)
  trackById(index: number, product: Product) {
    return product._id;
  }

  loadMoreProducts() {
    if (!this.hasMoreProducts || this.isLoadingMore || this.isLoadingProducts) return;
    this.productPage++;
    this.loadProducts(false);
  }

  // Dipanggil saat mengetik (tunggu 300ms) atau ganti kategori (langsung)
  filterProducts(immediate = false) {
    clearTimeout(this.searchTimer);
    // Mengetik pencarian = mencari di semua produk, bukan hanya yang terlaris
    if (!immediate && this.selectedCategory === 'terlaris') this.selectedCategory = '';
    if (this.productGridRef) this.productGridRef.nativeElement.scrollTop = 0;
    if (immediate) {
      this.loadProducts();
    } else {
      this.searchTimer = setTimeout(() => this.loadProducts(), 300);
    }
  }

  // Enter di kolom cari (mis. setelah scan barcode): langsung masukkan produk yang cocok ke keranjang
  addFromSearch() {
    const query = this.searchQuery.trim();
    if (!query) return;
    clearTimeout(this.searchTimer); // batalkan pencarian tertunda, kita cari sendiri di bawah

    this.productService.getAll({ page: 1, limit: 5, inStock: 'true', search: query }).subscribe({
      next: (res: any) => {
        const products: Product[] = res.data || [];
        const q = query.toLowerCase();
        const exact = products.filter(p => p.barcode?.toLowerCase() === q || p.sku?.toLowerCase() === q);
        const match = exact.length === 1 ? exact[0] : (products.length === 1 ? products[0] : null);

        if (match) {
          this.addToCart(match);
          this.searchQuery = '';
          this.loadProducts();
        } else if (products.length === 0) {
          this.toastService.warning('Produk tidak ditemukan', 'Periksa kode atau stoknya.');
        } else {
          this.toastService.info('Ada beberapa produk cocok', 'Pilih produknya dari daftar.');
        }
      }
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
      usePoints: this.usePoints,
      downPayment: this.downPayment,
      downPaymentMethod: this.downPaymentMethod
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
    this.downPayment = held.downPayment || 0;
    this.downPaymentMethod = held.downPaymentMethod || 'tunai';
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
    this.downPayment = 0;
    this.downPaymentMethod = 'tunai';
    this.keepChangeAmount = 0;
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

  // Kembalian hanya ada untuk pembayaran tunai
  get canKeepChange(): boolean {
    return this.paymentMethod === 'tunai' && this.change > 0;
  }

  // Tercentang hanya untuk nominal kembalian saat dicentang. Kalau uang diterima berubah
  // sehingga kembaliannya berbeda, centang otomatis lepas (mencegah salah catat).
  get isKeepChange(): boolean {
    return this.canKeepChange && this.keepChangeAmount === this.change;
  }

  toggleKeepChange(checked: boolean) {
    this.keepChangeAmount = checked ? this.change : 0;
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
    if (this.paymentMethod === 'hutang' && this.isDownPaymentInvalid) return false;
    return true;
  }

  // Uang muka valid kalau kosong/0, atau lebih dari 0 tapi kurang dari total
  get isDownPaymentInvalid(): boolean {
    const dp = Number(this.downPayment) || 0;
    return dp < 0 || (dp > 0 && dp >= this.grandTotal);
  }

  // Sisa yang benar-benar jadi hutang setelah uang muka
  get debtRemaining(): number {
    return Math.max(0, this.grandTotal - (Number(this.downPayment) || 0));
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

    if (this.paymentMethod === 'hutang' && Number(this.downPayment) > 0) {
      payload.downPayment = Number(this.downPayment);
      payload.downPaymentMethod = this.downPaymentMethod;
    }

    if (this.isKeepChange) {
      payload.keepChange = true;
    }

    this.transactionService.create(payload).subscribe({
      next: (res) => {
        this.lastInvoice = res.data?.invoiceNumber || '';
        this.showSuccess = true;
        this.lastTransaction = res.data;
        this.isSubmitting = false;
        this.resetCartState();
        this.refreshProducts();
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