import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobsService } from '../services/jobs.service';
import { CandidatesService } from '../services/candidates.service';
import { Job, Candidate } from '../models';
import { Observable, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private jobsService = inject(JobsService);
  private candidatesService = inject(CandidatesService);

  metrics$: Observable<any>;
  recentJobs$: Observable<Job[]>;
  recentCandidates$: Observable<Candidate[]>;

  constructor() {
    this.metrics$ = combineLatest([
      this.jobsService.jobs$,
      this.candidatesService.candidates$
    ]).pipe(
      map(([jobs, candidates]) => {
        return {
          totalJobs: jobs.length,
          totalCandidates: candidates.length,
          shortlisted: candidates.filter(c => c.status === 'Shortlisted').length,
          inProcess: candidates.filter(c => c.status === 'In Process').length,
          hired: candidates.filter(c => c.status === 'Hired').length
        };
      })
    );

    this.recentJobs$ = this.jobsService.jobs$.pipe(
      map(jobs => [...jobs].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).slice(0, 5))
    );

    this.recentCandidates$ = this.candidatesService.candidates$.pipe(
      map(candidates => [...candidates].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).slice(0, 5))
    );
  }

  ngOnInit(): void {
  }
}
