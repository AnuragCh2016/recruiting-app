import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

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
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  sessionExpired: boolean = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['expired'] === 'true') {
        this.sessionExpired = true;
        this.errorMessage =
          'Your session has expired. Please log in again to continue.';

        // OPTIONAL: Clear the URL immediately so a refresh doesn't keep showing it
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { expired: null },
          queryParamsHandling: 'merge',
        });
      }
    });
  }

  login(): void {
    if (!this.email || !this.password || this.loading) {
      return;
    }

    this.errorMessage = '';
    this.sessionExpired = false;
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
          // Try to get returnUrl from the browser address bar
          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';

          // CHECK: If there is no returnUrl OR if the returnUrl IS '/login',
          // redirect to the dashboard instead.
          if (!returnUrl || returnUrl.includes('/login')) {
            this.router.navigate(['/dashboard'], { replaceUrl: true });
          } else {
            // Otherwise, take them where they wanted to go
            this.router.navigateByUrl(returnUrl, { replaceUrl: true });
          }
        },
        error: (err: HttpErrorResponse) => {
          // 1. Check the status code directly
          if (err.status === 500) {
            this.errorMessage =
              'Server error (500). Please check if the backend is running.';
          } else if (err.status === 401) {
            this.errorMessage = 'Invalid email or password.';
          } else if (err.status === 403) {
            this.errorMessage =
              'Your account has been deactivated, contact Admin';
          } else if (err.status === 0) {
            this.errorMessage =
              'Cannot connect to server. Check your internet or CORS settings.';
          } else {
            // 2. Fallback to the detail provided by FastAPI or a general message
            this.errorMessage =
              err.error?.detail || 'An unexpected error occurred.';
          }

          console.error('Login Error Object:', err); // Log the full error for debugging
        },
      });
  }
}
