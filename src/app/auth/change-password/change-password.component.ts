import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'],
})
export class ChangePasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  get isForcedChange(): boolean {
    return this.authService.shouldForcePasswordChange();
  }

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword || this.loading) {
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New password and confirm password do not match.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    this.authService
      .changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Password updated successfully.';
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.detail ||
            'Unable to update password. Please try again.';
        },
      });
  }
}
