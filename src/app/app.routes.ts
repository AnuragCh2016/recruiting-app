import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { JobsListComponent } from './jobs/jobs-list/jobs-list.component';
import { JobDetailComponent } from './jobs/job-detail/job-detail.component';
import { AddJobComponent } from './jobs/add-job/add-job.component';
import { CandidateListComponent } from './candidates/candidate-list/candidate-list.component';
import { AddCandidateComponent } from './candidates/add-candidate/add-candidate.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'jobs', component: JobsListComponent },
  { path: 'jobs/:id', component: JobDetailComponent },
  { path: 'add-job', component: AddJobComponent },
  { path: 'jobs/edit/:id', component: AddJobComponent },
  { path: 'candidates', component: CandidateListComponent },
  { path: 'add-candidate', component: AddCandidateComponent },
  { path: 'candidates/edit/:id', component: AddCandidateComponent },
  { path: 'candidates/edit/:id', component: AddCandidateComponent }
];
