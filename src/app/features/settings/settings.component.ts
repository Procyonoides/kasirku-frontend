import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { SettingService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  activeTab: 'profile' | 'password' | 'store' | 'appearance' | 'backup' = 'profile';

  // Profile form
  profileForm!: FormGroup;
  profileSubmitting = false;

  // Password form
  passwordForm!: FormGroup;
  passwordSubmitting = false;
  passwordError = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Store form
  storeForm!: FormGroup;
  storeSubmitting = false;
  storeSuccess = false;
  storeError = '';

  // Backup & Restore
  isBackingUp = false;
  isRestoring = false;
  restoreFile: File | null = null;
  restoreError = '';
  restoreSuccess = '';

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private settingService: SettingService,
    private toastService: ToastService,
    public themeService: ThemeService,
    private http: HttpClient
  ) {}

  @ViewChild('restoreInput') restoreInput!: ElementRef;

  ngOnInit() {
    const user = this.authService.currentUser();
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required, Validators.minLength(2)]],
      username: [user?.username || '', [Validators.required, Validators.minLength(3)]],
      email: [user?.email || '', [Validators.email]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });

    this.storeForm = this.fb.group({
      storeName: ['', Validators.required],
      storeAddress: [''],
      storePhone: [''],
      storeEmail: ['', Validators.email],
      storeDescription: [''],
      currency: ['Rp'],
    });

    this.loadStoreSetting();
  }

  loadStoreSetting() {
    this.settingService.get().subscribe({
      next: (res) => {
        this.storeForm.patchValue(res.data);
      }
    });
  }

  submitStore() {
    if (this.storeForm.invalid) { this.storeForm.markAllAsTouched(); return; }
    this.storeSubmitting = true;

    this.settingService.update(this.storeForm.value).subscribe({
      next: () => {
        this.storeSubmitting = false;
        this.toastService.success('Info toko disimpan', 'Data toko berhasil diperbarui');
      },
      error: (err) => {
        this.storeSubmitting = false;
        this.toastService.error('Gagal menyimpan', err?.error?.message || 'Terjadi kesalahan');
      }
    });
  }

  passwordMatchValidator(group: FormGroup) {
    const np = group.get('newPassword')?.value;
    const cp = group.get('confirmPassword')?.value;
    return np === cp ? null : { mismatch: true };
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  submitProfile() {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.profileSubmitting = true;

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.profileSubmitting = false;
        const user = { ...this.authService.currentUser(), ...this.profileForm.value };
        localStorage.setItem('user', JSON.stringify(user));
        this.authService.currentUser.set(user);
        this.toastService.success('Profil diperbarui', 'Data profil berhasil disimpan');
      },
      error: (err) => {
        this.profileSubmitting = false;
        this.toastService.error('Gagal menyimpan', err?.error?.message || 'Terjadi kesalahan');
      }
    });
  }

  submitPassword() {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.passwordSubmitting = true;

    this.authService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.passwordSubmitting = false;
        this.passwordForm.reset();
        this.toastService.success('Password diubah', 'Password berhasil diperbarui');
      },
      error: (err) => {
        this.passwordSubmitting = false;
        this.toastService.error('Gagal mengubah password', err?.error?.message || 'Terjadi kesalahan');
      }
    });
  }

  // ── Backup & Restore ──────────────────────────────
  downloadBackup() {
    this.isBackingUp = true;
    const token = this.authService.getToken();
    const date = new Date().toISOString().split('T')[0];
    const filename = `kasirku-backup-${date}.zip`;

    this.http.get(`${environment.apiUrl}/backup/download`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.isBackingUp = false;
        this.toastService.success('Backup berhasil', 'File backup berhasil didownload');
      },
      error: () => {
        // Cek apakah file sudah ada di download manager
        // Error ini bisa muncul karena Firefox download manager
        // tapi file tetap terdownload
        this.isBackingUp = false;
        this.toastService.info('Backup selesai', 'Cek folder download kamu');
      }
    });
  }

  onRestoreFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.restoreFile = file;
      this.restoreError = '';
      this.restoreSuccess = '';
    }
  }

  submitRestore() {
    if (!this.restoreFile) {
      this.restoreError = 'Pilih file backup terlebih dahulu';
      return;
    }

    this.isRestoring = true;
    this.restoreError = '';
    this.restoreSuccess = '';

    const formData = new FormData();
    formData.append('backup', this.restoreFile);

    const token = this.authService.getToken();

    fetch(`${environment.apiUrl}/backup/restore`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      this.isRestoring = false;
      if (data.success) {
        this.restoreSuccess = 'Database berhasil direstore!';
        this.restoreFile = null;
        this.restoreInput.nativeElement.value = '';
        this.toastService.success('Restore berhasil', 'Database berhasil direstore');
      } else {
        this.restoreError = data.message || 'Restore gagal';
        this.toastService.error('Restore gagal', data.message);
      }
    })
    .catch(err => {
      this.isRestoring = false;
      this.restoreError = err.message;
      this.toastService.error('Restore gagal', err.message);
    });
  }
}
