import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  login(): void {
    if (!this.email || !this.password || this.loading) {
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    this.authService
      .login({ email: this.email, password: this.password })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          if (this.authService.shouldForcePasswordChange()) {
            this.router.navigate(['/change-password']);
            return;
          }

          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.detail ||
            'Login failed. Please verify your credentials.';
        },
      });
  }
}
