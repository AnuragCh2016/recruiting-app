import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, of, tap, map, combineLatest } from 'rxjs';
import { UserRead, UserRole } from '../../models';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css'],
})
export class ManageUsersComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  users$!: Observable<UserRead[]>;
  managers$!: Observable<UserRead[]>;
  fetchError: boolean = false;
  UserRole = UserRole; // For template access

  currentUser: any = null;

  constructor() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    // Use combineLatest to ensure currentUser is loaded before filtering
    this.users$ = combineLatest([
      this.userService.getAllUsers(),
      this.authService.currentUser$,
    ]).pipe(
      tap(() => (this.fetchError = false)),
      map(([users, currentUser]) => {
        // Filter out the logged-in user from the list
        if (currentUser?.id) {
          return users.filter((user) => user.id !== currentUser.id);
        }
        return users;
      }),
      catchError((err) => {
        this.fetchError = true;
        console.error('Error fetching users:', err);
        return of([]);
      }),
    );

    // Create managers stream for the dropdown
    this.managers$ = this.users$.pipe(
      map((users) =>
        users.filter(
          (u) =>
            u.isActive &&
            u.role !== UserRole.Recruiter &&
            u.role !== UserRole.Admin,
        ),
      ),
    );
  }

  /**
   * Check if current user can manage users
   */
  canManageUsers(): boolean {
    return (
      this.currentUser?.role === UserRole.Admin ||
      this.currentUser?.role === UserRole.Manager
    );
  }

  /**
   * Check if current user is admin (for role changes and deactivation)
   */
  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.Admin;
  }

  /**
   * Deactivate a user (Admin only)
   */
  deactivateUser(userId: number, userName: string): void {
    if (!confirm(`Are you sure you want to deactivate ${userName}?`)) {
      return;
    }

    this.userService.deactivateUser(userId).subscribe({
      next: (response) => {
        alert(response.message || 'User deactivated successfully');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error deactivating user:', err);
        alert(err.error?.detail || 'Failed to deactivate user');
      },
    });
  }

  /**
   * Change user role (Admin only)
   */
  changeUserRole(userId: number, newRole: UserRole): void {
    if (
      !confirm(
        `Are you sure you want to change this user's role to ${newRole}?`,
      )
    ) {
      return;
    }

    this.userService.changeUserRole(userId, newRole).subscribe({
      next: (response) => {
        alert(response.message || 'User role updated successfully');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error changing user role:', err);
        alert(err.error?.detail || 'Failed to change user role');
      },
    });
  }

  /**
   * Assign manager to user (Admin/Manager only)
   * Backend: PATCH /user/{user_id}/assign-manager
   */
  assignManager(userId: number, managerId: number): void {
    if (!managerId) {
      return; // No manager selected
    }

    if (
      !confirm(
        `Are you sure you want to assign this user to the selected manager?`,
      )
    ) {
      this.loadUsers(); // Reload to reset the dropdown
      return;
    }

    this.userService.assignManager(userId, managerId).subscribe({
      next: (response) => {
        alert(response.message || 'Manager assigned successfully');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error assigning manager:', err);
        alert(err.error?.detail || 'Failed to assign manager');
        this.loadUsers(); // Reload to reset the dropdown
      },
    });
  }

  /**
   * Get badge color based on role
   */
  getRoleBadgeClass(role: UserRole): string {
    const roleClasses: Record<string, string> = {
      [UserRole.Admin]: 'bg-purple-100 text-purple-800',
      [UserRole.Manager]: 'bg-blue-100 text-blue-800',
      [UserRole.TeamLead]: 'bg-indigo-100 text-indigo-800',
      [UserRole.Recruiter]: 'bg-green-100 text-green-800',
    };
    return roleClasses[role] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get badge color based on active status
   */
  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  /**
   * Get all roles for dropdown (excluding Admin)
   */
  getAllRoles(): UserRole[] {
    return Object.values(UserRole).filter((role) => role !== UserRole.Admin);
  }

  reloadPage() {
    window.location.reload();
  }
}
