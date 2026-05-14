import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators'; // Crucial fix for the 'map' error

import { JobsService } from '../services/jobs.service';
import { ApplicationService } from '../services/application.service';
import { CandidateService } from '../services/candidate.service';
import { Job, ApplicationStatus, CandidateListRead } from '../models';

// The interface you were missing
export interface DashboardMetrics {
  totalJobs: number;
  totalCandidates: number;
  shortlisted: number;
  inProcess: number;
  hired: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private jobsService = inject(JobsService);
  private appService = inject(ApplicationService);
  private candidateService = inject(CandidateService);

  recentJobs$: Observable<Job[]>;
  recentCandidates$: Observable<CandidateListRead[]>;
  metrics$: Observable<DashboardMetrics>;

  constructor() {
    // Metrics calculation
    this.metrics$ = combineLatest({
      jobs: this.jobsService.jobs$,
      apps: this.appService.applications$,
      candidates: this.candidateService.candidates$,
    }).pipe(
      map(({ jobs, apps, candidates }) => ({
        totalJobs: jobs.filter((j) => j.status === 'Open').length,
        totalCandidates: candidates.length,
        shortlisted: apps.filter((a) => a.status === ApplicationStatus.Shared)
          .length,
        inProcess: apps.filter((a) => a.status === ApplicationStatus.InProcess)
          .length,
        hired: apps.filter((a) => a.status === ApplicationStatus.Joined).length,
      })),
    );

    // Recent Jobs
    this.recentJobs$ = this.jobsService.jobs$.pipe(
      map((jobs) =>
        [...jobs]
          .sort(
            (a, b) =>
              new Date(b.createdDate).getTime() -
              new Date(a.createdDate).getTime(),
          )
          .slice(0, 5),
      ),
    );

    // Recent Candidates
    this.recentCandidates$ = this.candidateService.candidates$.pipe(
      map((candidates) =>
        [...candidates]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 5),
      ),
    );
  }

  ngOnInit(): void {
    // Load data when dashboard initializes (after login)
    this.jobsService.refreshJobs().subscribe();
    this.appService.refreshApplications();
    this.candidateService.refreshCandidates();
  }
}
