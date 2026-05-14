import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  JobAllocationService,
  JobAllocatePayload,
} from '../../services/job-allocation.service';
import { UserService } from '../../services/user.service';
import { JobsService } from '../../services/jobs.service';
import { AuthService } from '../../services/auth.service';
import { Job, UserRead, UserRole } from '../../models';
import { Observable, map, tap, catchError, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-allocate-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './allocate-job.component.html',
  styleUrls: ['./allocate-job.component.css'],
})
export class AllocateJobComponent implements OnInit {
  private fb = inject(FormBuilder);
  private jobAllocationService = inject(JobAllocationService);
  private userService = inject(UserService);
  private jobsService = inject(JobsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  allocationForm: FormGroup;
  submitting = false;

  // Data streams
  jobs$: Observable<Job[]>;
  users$: Observable<UserRead[]>;
  teamMembers$!: Observable<UserRead[]>;

  // Current user info
  currentUser: any = null;
  UserRole = UserRole;

  // Dynamic options
  showTeamCheckbox = false;
  selectedUserIsTL = false;
  teamMembers: UserRead[] = [];

  constructor() {
    this.allocationForm = this.fb.group({
      jobId: ['', Validators.required],
      userId: ['', Validators.required],
      assignToTeam: [false],
    });

    // Load jobs
    this.jobs$ = this.jobsService
      .refreshJobs()
      .pipe(map(() => this.jobsService.currentJobsValue || []));

    // Load all users (filtered by role in template)
    this.users$ = this.userService.getAllUsers().pipe(
      tap((users) => {
        // Filter to show only active users
        return users.filter((u) => u.isActive);
      }),
    );

    // Subscribe to current user
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      // Reload users when current user changes to apply proper filtering
      if (user) {
        this.users$ = this.userService
          .getAllUsers()
          .pipe(map((allUsers) => this.getAvailableUsers(allUsers)));
      }
    });

    // Watch for user selection changes
    this.allocationForm.get('userId')?.valueChanges.subscribe((userId) => {
      this.onUserSelected(userId);
    });
  }

  ngOnInit(): void {}

  get f() {
    return this.allocationForm.controls;
  }

  /**
   * Handle user selection - check if TL and load team members
   * Show "assign to team" checkbox based on role and selected user
   */
  onUserSelected(userId: number): void {
    if (!userId) {
      this.showTeamCheckbox = false;
      this.selectedUserIsTL = false;
      this.teamMembers = [];
      return;
    }

    // Get all users (unfiltered) to find the selected user
    this.userService.getAllUsers().subscribe((allUsers) => {
      const selectedUser = allUsers.find((u) => u.id == userId);

      if (selectedUser) {
        this.selectedUserIsTL = selectedUser.role === UserRole.TeamLead;

        // Show team checkbox if selected user is TL
        if (this.selectedUserIsTL) {
          this.showTeamCheckbox = true;

          // Load team members for the selected TL
          this.teamMembers$ = this.jobAllocationService
            .getTlTeamMembers(userId)
            .pipe(
              catchError((err) => {
                console.error('Error loading team members:', err);
                return of([]);
              }),
            );

          this.teamMembers$.subscribe((members) => {
            this.teamMembers = members;
            console.log('Loaded team members:', members.length);
          });
        } else {
          this.showTeamCheckbox = false;
          this.teamMembers = [];
        }
      } else {
        console.warn('Selected user not found:', userId);
        this.showTeamCheckbox = false;
        this.teamMembers = [];
      }
    });
  }

  /**
   * Submit job allocation
   * Uses backend endpoints:
   * - POST /user/jobs/{job_id}/assign-team/{target_user_id} - if assignToTeam is checked
   * - POST /user/{job_id}/assign/{user_id} - if assigning to individual only
   */
  onSubmit(): void {
    if (this.allocationForm.invalid) {
      this.allocationForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const jobId = parseInt(this.f['jobId'].value);
    const userId = parseInt(this.f['userId'].value);
    const assignToTeam = this.f['assignToTeam'].value;

    // Choose endpoint based on "assign to team" checkbox
    if (assignToTeam && this.selectedUserIsTL) {
      // Assign to TL + entire team (recursive)
      this.jobAllocationService.assignJobToTeam(jobId, userId).subscribe({
        next: (response) => {
          alert(response.message || 'Job allocated to team successfully!');
          this.router.navigate(['/jobs']);
        },
        error: (err) => {
          console.error('Error allocating job to team:', err);
          let errorMessage = 'Failed to allocate job';

          if (err.error?.detail) {
            errorMessage = err.error.detail;
          }

          alert(errorMessage);
          this.submitting = false;
        },
      });
    } else {
      // Assign to individual user only
      this.jobAllocationService.assignJobToUser(jobId, userId).subscribe({
        next: (response) => {
          alert(
            response.status === 'success'
              ? 'Job allocated successfully!'
              : 'Job allocated successfully!',
          );
          this.router.navigate(['/jobs']);
        },
        error: (err) => {
          console.error('Error allocating job:', err);
          let errorMessage = 'Failed to allocate job';

          if (err.error?.detail) {
            errorMessage = err.error.detail;
          }

          alert(errorMessage);
          this.submitting = false;
        },
      });
    }
  }

  /**
   * Get available users based on current user's role
   * Matches backend authorization logic from user.py router
   */
  getAvailableUsers(allUsers: UserRead[]): UserRead[] {
    if (!this.currentUser) return [];

    switch (this.currentUser.role) {
      case UserRole.Admin:
        // Admin can assign to: Manager, TL, or User (Recruiter)
        // Filter out Admins (can't assign to other admins)
        return allUsers.filter((u) => u.role !== UserRole.Admin && u.isActive);

      case UserRole.Manager:
        // Manager can assign to: TLs OR their direct team members
        // This includes all users where manager is either:
        // 1. A Team Lead (any TL)
        // 2. A Recruiter reporting to this manager
        return allUsers.filter(
          (u) =>
            u.role === UserRole.TeamLead ||
            (u.role === UserRole.Recruiter &&
              u.managerId === this.currentUser.id),
        );

      case UserRole.TeamLead:
        // TL can only assign to their direct team members (Recruiters reporting to them)
        return allUsers.filter(
          (u) =>
            u.managerId === this.currentUser.id &&
            u.role === UserRole.Recruiter,
        );

      default:
        // Recruiters cannot assign jobs
        return [];
    }
  }

  /**
   * Get manager name from user ID
   */
  getManagerName(managerId: number, users: UserRead[] | null): string {
    if (!users || !managerId) return '';
    const manager = users.find((u) => u.id === managerId);
    return manager ? manager.fullName : 'Unknown';
  }
}
