import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService, UserCreatePayload } from '../../services/user.service';
import { UserRole } from '../../models';
import { Observable, map } from 'rxjs';
import { UserRead } from '../../models';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css'],
})
export class AddUserComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);

  userForm: FormGroup;
  submitting = false;
  managers$: Observable<UserRead[]>;

  userRoles = Object.values(UserRole).filter((role) => role !== UserRole.Admin); // Exclude Admin role

  constructor() {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [UserRole.Recruiter, Validators.required],
      managerId: [''],
    });

    this.managers$ = this.userService
      .getAllUsers()
      .pipe(
        map((users) =>
          users.filter(
            (user) =>
              user.role === UserRole.Admin || user.role === UserRole.Manager,
          ),
        ),
      );
  }

  ngOnInit(): void {}

  get f() {
    return this.userForm.controls;
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const payload: UserCreatePayload = {
      fullName: this.f['fullName'].value,
      email: this.f['email'].value,
      phone: this.f['phone'].value,
      password: this.f['password'].value,
      role: this.f['role'].value,
      managerId: this.f['managerId'].value
        ? parseInt(this.f['managerId'].value)
        : undefined,
    };

    this.userService.createUser(payload).subscribe({
      next: (response) => {
        alert('User created successfully!');
        this.router.navigate(['/users']);
      },
      error: (err) => {
        console.error('Error creating user:', err);
        let errorMessage = 'Failed to create user';

        if (err.error?.detail) {
          if (typeof err.error.detail === 'string') {
            errorMessage = err.error.detail;
          } else if (Array.isArray(err.error.detail)) {
            errorMessage = err.error.detail.map((e: any) => e.msg).join(', ');
          }
        }

        alert(errorMessage);
        this.submitting = false;
      },
    });
  }
}
