import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, switchMap, map, take, combineLatest } from 'rxjs';

import { JobsService } from '../../services/jobs.service';
import { ApplicationService } from '../../services/application.service';
import {
  Job,
  Application,
  ApplicationStatus,
  JobReadWithApplications,
  ApplicationSummary,
  ApplicationRead,
} from '../../models';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css'],
})
export class JobDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private jobsService = inject(JobsService);
  private appService = inject(ApplicationService);

  // We only need one primary stream because Job now includes the tracker applications
  job$: Observable<JobReadWithApplications | undefined>;

  readonly statuses: ApplicationStatus[] = [
    ApplicationStatus.Sourced,
    ApplicationStatus.Shared,
    ApplicationStatus.InProcess,
    ApplicationStatus.OfferReleased,
    ApplicationStatus.Rejected,
    ApplicationStatus.Joined,
  ];

  editingAppId: number | null = null;
  tempStatus: ApplicationStatus | '' = '';

  constructor() {
    const jobId$ = this.route.paramMap.pipe(
      map((params) => Number(params.get('id'))),
    );

    // Fetch the Job. Our backend Join ensures job.applications
    // now contains candidate_name and sourced_by_name.
    this.job$ = jobId$.pipe(switchMap((id) => this.jobsService.getJob(id)));
  }

  ngOnInit(): void {}

  // --- Table Logic ---

  startEditing(app: ApplicationRead) {
    this.editingAppId = app.id;
    this.tempStatus = app.status;
  }

  cancelEditing() {
    this.editingAppId = null;
    this.tempStatus = '';
  }

  saveStatus(app: ApplicationRead) {
    if (!this.tempStatus || this.tempStatus === app.status) {
      this.cancelEditing();
      return;
    }

    // Now uses the candidate_name we injected in the backend Join
    if (
      confirm(`Change status to "${this.tempStatus}" for ${app.candidateName}?`)
    ) {
      this.appService
        .updateStatus(app.id, this.tempStatus as ApplicationStatus)
        .subscribe({
          next: () => {
            this.cancelEditing();
            // Optional: Trigger a refresh of the job data to show new status
            this.refreshJobData();
          },
          error: (err) => console.error('Status update failed', err),
        });
    } else {
      this.cancelEditing();
    }
  }

  private refreshJobData() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.job$ = this.jobsService.getJob(id);
  }

  // --- Export Logic ---

  async exportToExcel() {
    const XLSX = await import('xlsx');

    // todo: implement
  }
}
