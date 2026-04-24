import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<any>(null);
  isLoggedIn = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          this.currentUser.set(res.data.user);
          this.isLoggedIn.set(true);
        }
      })
    );
  }

  logout(): void {
    // Hapus data lokal DULU sebelum HTTP call
    // agar interceptor tidak attach token ke request logout
    // dan tidak memicu infinite loop 401
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/auth/login']);
    // Fire-and-forget: beritahu server (tidak perlu sukses)
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => {} });
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<any>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      tap(res => {
        if (res.success) localStorage.setItem('token', res.data.token);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.role) : false;
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      if (token && userStr) {
        // Cek apakah token sudah expired
        if (this.isTokenExpired(token)) {
          // Token expired, hapus semua
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          return;
        }
        this.currentUser.set(JSON.parse(userStr));
        this.isLoggedIn.set(true);
      }
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true; // Kalau token tidak valid, anggap expired
    }
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-profile`, data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, data);
  }

}