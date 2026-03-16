// ─── Auth ──────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  username: string;
  role: 'owner' | 'admin' | 'kasir';
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
}

// ─── Category ─────────────────────────────────────────────────
export interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

// ─── Product ───────────────────────────────────────────────────
export interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category?: Category;
  description?: string;
  image?: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
  profitMargin?: string;
  stockStatus?: 'aman' | 'menipis' | 'habis';
}

// ─── Customer ──────────────────────────────────────────────────
export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit: number;
  currentDebt: number;
  totalTransactions: number;
  totalSpent: number;
  points: number;
  customerTier?: 'regular' | 'silver' | 'gold' | 'platinum';
}

// ─── Transaction ───────────────────────────────────────────────
export interface TransactionItem {
  product: string | Product;
  productName: string;
  productSku?: string;
  qty: number;
  buyPrice: number;
  sellPrice: number;
  discount: number;
  subtotal: number;
}

export interface Transaction {
  _id: string;
  invoiceNumber: string;
  customer?: Customer;
  customerName: string;
  items: TransactionItem[];
  subtotal: number;
  discountTotal: number;
  discountPercent: number;
  tax: number;
  taxPercent: number;
  grandTotal: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  isDebt: boolean;
  status: 'selesai' | 'dibatalkan' | 'hutang';
  notes?: string;
  cashier?: User;
  createdAt: Date;
}

// ─── Finance ───────────────────────────────────────────────────
export interface Finance {
  _id: string;
  type: 'pemasukan' | 'pengeluaran' | 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: Date | string;
  paymentMethod?: string;
}

// ─── Cart (POS) ───────────────────────────────────────────────
export interface CartItem {
  product: Product;
  qty: number;
  discount: number;
  subtotal: number;
}

// ─── Dashboard ────────────────────────────────────────────────
export interface DashboardStats {
  today: { transactions: number; revenue: number; profit: number; };
  month: { transactions: number; revenue: number; };
  inventory: { total: number; lowStock: number; };
  customers: { total: number; debtors: number; };
}

// ─── API Response ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

// ─── Settings ─────────────────────────────────────────────
export interface Setting {
  _id?: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeDescription: string;
  currency: string;
}