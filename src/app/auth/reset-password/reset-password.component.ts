import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent {
  private authService = inject(AuthService);

  email = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  loadingRequest = false;
  loadingReset = false;

  infoMessage = '';
  errorMessage = '';

  requestResetLink(): void {
    if (!this.email || this.loadingRequest) {
      return;
    }

    this.errorMessage = '';
    this.infoMessage = '';
    this.loadingRequest = true;

    this.authService
      .requestPasswordReset(this.email)
      .pipe(finalize(() => (this.loadingRequest = false)))
      .subscribe({
        next: () => {
          this.infoMessage =
            'If the email exists, password reset instructions have been sent.';
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.detail || 'Unable to request password reset right now.';
        },
      });
  }

  resetPassword(): void {
    if (!this.token || !this.newPassword || this.loadingReset) {
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New password and confirm password do not match.';
      return;
    }

    this.errorMessage = '';
    this.infoMessage = '';
    this.loadingReset = true;

    this.authService
      .resetPassword({ token: this.token, newPassword: this.newPassword })
      .pipe(finalize(() => (this.loadingReset = false)))
      .subscribe({
        next: () => {
          this.infoMessage =
            'Password reset successful. You can now sign in with your new password.';
          this.token = '';
          this.newPassword = '';
          this.confirmPassword = '';
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.detail ||
            'Password reset failed. Please verify your reset token.';
        },
      });
  }
}
