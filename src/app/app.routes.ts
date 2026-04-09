import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { JobsListComponent } from './jobs/jobs-list/jobs-list.component';
import { JobDetailComponent } from './jobs/job-detail/job-detail.component';
import { AddJobComponent } from './jobs/add-job/add-job.component';
import { CandidateListComponent } from './candidates/candidate-list/candidate-list.component';
import { CandidateDetailComponent } from './candidates/candidate-detail/candidate-detail.component';
import { AddCandidateComponent } from './candidates/add-candidate/add-candidate.component';
import { LoginComponent } from './auth/login/login.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { ChangePasswordComponent } from './auth/change-password/change-password.component';
import { authGuard, passwordChangeGuard, publicOnlyGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [publicOnlyGuard] },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [passwordChangeGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  { path: 'jobs', component: JobsListComponent, canActivate: [authGuard] },
  { path: 'jobs/:id', component: JobDetailComponent, canActivate: [authGuard] },
  { path: 'add-job', component: AddJobComponent, canActivate: [authGuard] },
  {
    path: 'jobs/edit/:id',
    component: AddJobComponent,
    canActivate: [authGuard],
  },
  {
    path: 'candidates',
    component: CandidateListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'candidates/:id',
    component: CandidateDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'add-candidate',
    component: AddCandidateComponent,
    canActivate: [authGuard],
  },
  {
    path: 'candidates/edit/:id',
    component: AddCandidateComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/login' },
];
