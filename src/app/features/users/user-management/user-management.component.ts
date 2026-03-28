import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/api.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, ConfirmDialogComponent, LoadingSpinnerComponent],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  isLoading = true;

  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  selectedUser: any = null;

  formName = '';
  formUsername = '';
  formPassword = '';
  formRole = 'kasir';
  formError = '';
  formSubmitting = false;

  showResetModal = false;
  resetUserId = '';
  resetUsername = '';
  resetPassword = '';
  resetError = '';
  resetSubmitting = false;

  // Confirm dialog
  showConfirm = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  constructor(
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.isLoading = true;
    this.userService.getAll().subscribe({
      next: (res) => { this.users = res.data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  openAdd() {
    this.modalMode = 'add';
    this.formName = '';
    this.formUsername = '';
    this.formPassword = '';
    this.formRole = 'kasir';
    this.formError = '';
    this.selectedUser = null;
    this.showModal = true;
  }

  openEdit(user: any) {
    this.modalMode = 'edit';
    this.formName = user.name;
    this.formUsername = user.username;
    this.formPassword = '';
    this.formRole = user.role;
    this.formError = '';
    this.selectedUser = user;
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  submitForm() {
    if (!this.formName || !this.formUsername) {
      this.formError = 'Nama dan username wajib diisi';
      return;
    }
    if (this.modalMode === 'add' && !this.formPassword) {
      this.formError = 'Password wajib diisi';
      return;
    }

    this.formSubmitting = true;
    this.formError = '';

    const wasEdit = this.modalMode === 'edit';
    const data: any = { name: this.formName, username: this.formUsername, role: this.formRole };
    if (this.formPassword) data.password = this.formPassword;

    const req = wasEdit
      ? this.userService.update(this.selectedUser._id, data)
      : this.userService.create(data);

    req.subscribe({
      next: () => {
        this.showModal = false;
        this.formSubmitting = false;
        this.loadUsers();
        this.toastService.success(
          wasEdit ? 'User diperbarui' : 'User ditambahkan',
          'Data user berhasil disimpan'
        );
      },
      error: (err) => {
        this.formError = err?.error?.message || 'Terjadi kesalahan';
        this.formSubmitting = false;
        this.toastService.error('Gagal menyimpan', err?.error?.message || 'Terjadi kesalahan');
      }
    });
  }
 
  openResetPassword(user: any) {
    this.resetUserId = user._id;
    this.resetUsername = user.username;
    this.resetPassword = '';
    this.resetError = '';
    this.showResetModal = true;
  }

  closeResetModal() { this.showResetModal = false; }

  submitReset() {
    if (!this.resetPassword || this.resetPassword.length < 6) {
      this.resetError = 'Password minimal 6 karakter';
      return;
    }
    this.resetSubmitting = true;
    this.userService.resetPassword(this.resetUserId, this.resetPassword).subscribe({
      next: () => {
        this.showResetModal = false;
        this.resetSubmitting = false;
        this.toastService.success('Password direset', 'Password user berhasil direset');
      },
      error: (err) => {
        this.resetError = err?.error?.message || 'Terjadi kesalahan';
        this.resetSubmitting = false;
        this.toastService.error('Gagal reset password', err?.error?.message || 'Terjadi kesalahan');
      }
    });
  }

  deleteUser(id: string, name: string) {
    this.confirmTitle = 'Hapus User';
    this.confirmMessage = `Apakah Anda yakin ingin menghapus user "${name}"?`;
    this.confirmAction = () => {
      this.userService.delete(id).subscribe({
        next: () => {
          this.loadUsers();
          this.toastService.success('User dihapus', `User "${name}" berhasil dihapus`);
        }
      });
    };
    this.showConfirm = true;
  }

  toggleActive(user: any) {
    this.confirmTitle = user.isActive ? 'Nonaktifkan User' : 'Aktifkan User';
    this.confirmMessage = `Apakah Anda yakin ingin ${user.isActive ? 'nonaktifkan' : 'aktifkan'} user "${user.name}"?`;
    this.confirmAction = () => {
      this.userService.toggleActive(user._id).subscribe({
        next: () => {
          this.loadUsers();
          this.toastService.success(
            user.isActive ? 'User dinonaktifkan' : 'User diaktifkan',
            `User "${user.name}" berhasil ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`
          );
        }
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

  getRoleBadge(role: string): string {
    const map: Record<string, string> = {
      owner: 'badge-owner',
      admin: 'badge-admin',
      kasir: 'badge-kasir'
    };
    return map[role] || 'bg-secondary';
  }
}
