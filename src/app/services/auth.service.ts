import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { UserMinimum, UserRole } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  // 1. Store the user object (includes role and assigned_jobs)
  private currentUserSubject = new BehaviorSubject<UserMinimum | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const token = localStorage.getItem('access_token');

    if (token) {
      const decoded = this.decodeToken(token);

      if (decoded) {
        const user: UserMinimum = {
          id: decoded.sub,
          role: decoded.role,
          fullName: decoded.full_name,
          mustChangePassword: decoded.must_change_password,
          isFirstLogin: decoded.is_first_login,
          requirePasswordReset: decoded.require_password_reset,
        } as UserMinimum;

        this.currentUserSubject.next(user);
      }
    }
  }

  // Helper to get the current value without subscribing
  public get currentUserValue(): UserMinimum | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response && response.accessToken) {
          // 1. Save the actual string token
          localStorage.setItem('access_token', response.accessToken);

          // 2. Decode it
          const decoded = this.decodeToken(response.accessToken);

          if (decoded) {
            // 3. Map the Python snake_case claims to your CamelCase TypeScript interface
            const user: UserMinimum = {
              id: decoded.sub,
              role: decoded.role,
              fullName: decoded.name,
              mustChangePassword: decoded.must_change_password,
              isFirstLogin: decoded.is_first_login,
              requirePasswordReset: decoded.require_password_reset,
            } as UserMinimum;

            // 4. Update the subject with the MAPPED user, not the raw decoded object
            this.currentUserSubject.next(user);
          }
        }
      }),
    );
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { email });
  }

  resetPassword(payload: {
    token: string;
    newPassword: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      token: payload.token,
      new_password: payload.newPassword,
    });
  }

  // auth.service.ts
  changePassword(payload: any): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/change-password`, {
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
      })
      .pipe(
        tap(() => {
          // Get the current user from the BehaviorSubject
          const user = this.currentUserValue;
          if (user) {
            // Update the local flags so Guards don't block navigation
            const updatedUser = {
              ...user,
              mustChangePassword: false,
              isFirstLogin: false,
              requirePasswordReset: false,
            };
            // Push the "clean" user state back into the stream
            this.currentUserSubject.next(updatedUser);
          }
        }),
      );
  }

  shouldForcePasswordChange(
    user: UserMinimum | null = this.currentUserValue,
  ): boolean {
    if (!user) {
      return false;
    }

    const roleRequiresReset = [
      UserRole.Recruiter,
      UserRole.Manager,
      UserRole.TeamLead,
    ].includes(user.role);
    const isFirstLoginFlag = !!(
      user.mustChangePassword ||
      user.isFirstLogin ||
      user.requirePasswordReset
    );
    return roleRequiresReset && isFirstLoginFlag;
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    this.currentUserSubject.next(null);
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}
