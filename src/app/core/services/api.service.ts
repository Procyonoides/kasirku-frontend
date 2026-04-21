import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, Product, Customer, Transaction, Finance, DashboardStats, Category } from '../../shared/models';

// ─── Category Service ─────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private url = `${environment.apiUrl}/categories`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.url);
  }
  create(data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.url, data);
  }
  update(id: string, data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.url}/${id}`, data);
  }
  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.url}/${id}`);
  }
}

// ─── Product Service ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ProductService {
  private url = `${environment.apiUrl}/products`;
  constructor(private http: HttpClient) {}

  getById(id: string): Observable<any> {
    return this.http.get(`${this.url}/${id}`);
  }
  getAll(params?: any): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(this.url, { params });
  }
  search(q: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.url}/search`, { params: { q } });
  }
  getLowStock(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.url}/low-stock`);
  }
  getOne(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.url}/${id}`);
  }
  create(data: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.url, data);
  }
  update(id: string, data: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.url}/${id}`, data);
  }
  updateStock(id: string, qty: number, type: 'tambah' | 'kurang'): Observable<ApiResponse<Product>> {
    return this.http.patch<ApiResponse<Product>>(`${this.url}/${id}/stock`, { qty, type });
  }
  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.url}/${id}`);
  }
  uploadImage(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.url}/${id}/upload-image`, formData);
  }
  deleteImage(id: string): Observable<any> {
    return this.http.delete(`${this.url}/${id}/delete-image`);
  }
}

// ─── Customer Service ─────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private url = `${environment.apiUrl}/customers`;
  constructor(private http: HttpClient) {}

  getAll(params?: any): Observable<ApiResponse<Customer[]>> {
    return this.http.get<ApiResponse<Customer[]>>(this.url, { params });
  }
  getById(id: string): Observable<any> {
    return this.http.get(`${this.url}/${id}`);
  }
  getDebtors(): Observable<any> {
    return this.http.get<any>(`${this.url}/debtors`);
  }
  getOne(id: string): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.url}/${id}`);
  }
  getTransactions(id: string): Observable<ApiResponse<Transaction[]>> {
    return this.http.get<ApiResponse<Transaction[]>>(`${this.url}/${id}/transactions`);
  }
  getPointHistory(id: string): Observable<any> {
    return this.http.get(`${this.url}/${id}/points`);
  }
  create(data: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.url, data);
  }
  update(id: string, data: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.url}/${id}`, data);
  }
  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.url}/${id}`);
  }
}

// ─── Transaction Service ──────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TransactionService {
  private url = `${environment.apiUrl}/transactions`;
  constructor(private http: HttpClient) {}

  getAll(params?: any): Observable<ApiResponse<Transaction[]>> {
    return this.http.get<ApiResponse<Transaction[]>>(this.url, { params });
  }
  getToday(): Observable<any> {
    return this.http.get<any>(`${this.url}/today`);
  }
  getOne(id: string): Observable<ApiResponse<Transaction>> {
    return this.http.get<ApiResponse<Transaction>>(`${this.url}/${id}`);
  }
  create(data: any): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>(this.url, data);
  }
  cancel(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.url}/${id}/cancel`, {});
  }
  payDebt(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.url}/debt/${id}/pay`, data);
  }
}

// ─── Finance Service ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class FinanceService {
  private url = `${environment.apiUrl}/finance`;
  constructor(private http: HttpClient) {}

  getAll(params?: any): Observable<ApiResponse<Finance[]>> {
    return this.http.get<ApiResponse<Finance[]>>(this.url, { params });
  }
  getSummary(params?: any): Observable<any> {
    return this.http.get<any>(`${this.url}/summary`, { params });
  }
  create(data: Partial<Finance>): Observable<ApiResponse<Finance>> {
    return this.http.post<ApiResponse<Finance>>(this.url, data);
  }
  update(id: string, data: Partial<Finance>): Observable<ApiResponse<Finance>> {
    return this.http.put<ApiResponse<Finance>>(`${this.url}/${id}`, data);
  }
  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.url}/${id}`);
  }
}

// ─── Dashboard Service ────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private url = `${environment.apiUrl}/dashboard`;
  constructor(private http: HttpClient) {}

  getStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.url}/stats`);
  }
  getSalesChart(period = '7d'): Observable<any> {
    return this.http.get<any>(`${this.url}/chart/sales`, { params: { period } });
  }
  getRecent(): Observable<ApiResponse<Transaction[]>> {
    return this.http.get<ApiResponse<Transaction[]>>(`${this.url}/recent`);
  }
  getDailyRecap(): Observable<any> {
    return this.http.get<any>(`${this.url}/daily-recap`);
  }
}

// ─── Report Service ───────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ReportService {
  private url = `${environment.apiUrl}/reports`;
  constructor(private http: HttpClient) {}

  getSalesReport(params?: any): Observable<any> {
    return this.http.get<any>(`${this.url}/sales`, { params });
  }
  getProfitLoss(params?: any): Observable<any> {
    return this.http.get<any>(`${this.url}/profit-loss`, { params });
  }
  getTopProducts(params?: any): Observable<any> {
    return this.http.get<any>(`${this.url}/top-products`, { params });
  }
  getCashflow(params?: any): Observable<any> {
    return this.http.get<any>(`${this.url}/cashflow`, { params });
  }
}

// ─── Users Service ───────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UserService {
  private url = `${environment.apiUrl}/users`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<any> { return this.http.get(this.url); }
  getOne(id: string): Observable<any> { return this.http.get(`${this.url}/${id}`); }
  create(data: any): Observable<any> { return this.http.post(this.url, data); }
  update(id: string, data: any): Observable<any> { return this.http.put(`${this.url}/${id}`, data); }
  resetPassword(id: string, newPassword: string): Observable<any> { return this.http.patch(`${this.url}/${id}/reset-password`, { newPassword }); }
  toggleActive(id: string): Observable<any> { return this.http.patch(`${this.url}/${id}/toggle-active`, {}); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.url}/${id}`); }
}

// ─── Setting Service ─────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SettingService {
  private url = `${environment.apiUrl}/settings`;
  constructor(private http: HttpClient) {}

  get(): Observable<any> { return this.http.get(this.url); }
  update(data: any): Observable<any> { return this.http.put(this.url, data); }
}