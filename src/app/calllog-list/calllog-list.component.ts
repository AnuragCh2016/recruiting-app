import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, catchError, throwError, tap, map, of } from 'rxjs';
import {
  CallLogRead,
  CallLogCreate,
  RecruiterStatus,
  ApplicationStatus,
  Job,
  Application,
  ApplicationCreate,
} from '../models';
import { CallLogService } from '../services/call-log.service';
import { ApplicationService } from '../services/application.service';
import { JobsService } from '../services/jobs.service';

@Component({
  selector: 'app-calllog-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './calllog-list.component.html',
  styleUrls: ['./calllog-list.component.css'],
})
export class CalllogListComponent implements OnInit {
  private callLogService = inject(CallLogService);
  private applicationService = inject(ApplicationService);
  private jobsService = inject(JobsService);

  callLogs$: Observable<CallLogRead[]>;
  jobs$: Observable<Job[]>;
  fetchError: boolean = false;

  // Date filters
  startDate: string = '';
  endDate: string = '';

  // Modal state
  showCreateApplicationModal = false;
  selectedCallLog: CallLogRead | null = null;
  creatingApplication = false;

  // Application form data
  applicationFormData: ApplicationCreate = {
    candidateId: 0,
    jobId: 0,
    totalExperience: 0,
    relevantExperience: 0,
    currentCtc: 0,
    expectedCtc: 0,
    noticePeriod: '',
    comments: '',
    status: ApplicationStatus.Sourced,
  };

  constructor() {
    this.callLogs$ = this.callLogService.getMyCallLogs().pipe(
      tap(() => (this.fetchError = false)),
      catchError((err) => {
        this.fetchError = true;
        console.error('Error fetching call logs:', err);
        return of([]);
      }),
    );

    this.jobs$ = this.jobsService
      .refreshJobs()
      .pipe(map(() => this.jobsService.currentJobsValue || []));
  }

  ngOnInit(): void {
    // Set default dates to today
    const today = new Date().toISOString().split('T')[0];
    this.startDate = today;
    this.endDate = today;
  }

  /**
   * Reload call logs with date filters
   */
  loadCallLogs(): void {
    this.callLogs$ = this.callLogService
      .getMyCallLogs(this.startDate, this.endDate)
      .pipe(
        tap(() => (this.fetchError = false)),
        catchError((err) => {
          this.fetchError = true;
          console.error('Error fetching call logs:', err);
          return of([]);
        }),
      );
  }

  /**
   * Handle status change in the call log list
   * If status changes to 'Sourced', open the create application modal
   */
  onStatusChange(callLog: CallLogRead, newStatus: RecruiterStatus): void {
    if (newStatus === RecruiterStatus.Sourced) {
      this.openCreateApplicationModal(callLog);
    } else {
      // For other status changes, you might want to update the call log
      // This would require an update endpoint in the backend
      console.log('Status changed to:', newStatus);
    }
  }

  /**
   * Open the create application modal
   */
  openCreateApplicationModal(callLog: CallLogRead): void {
    this.selectedCallLog = callLog;
    this.applicationFormData = {
      candidateId: callLog.candidateId,
      jobId: callLog.associatedJobId,
      totalExperience: 0,
      relevantExperience: 0,
      currentCtc: 0,
      expectedCtc: 0,
      noticePeriod: '',
      comments: callLog.comments || '',
      status: ApplicationStatus.Sourced,
    };
    this.showCreateApplicationModal = true;
  }

  /**
   * Close the create application modal
   */
  closeCreateApplicationModal(): void {
    this.showCreateApplicationModal = false;
    this.selectedCallLog = null;
    this.applicationFormData = {
      candidateId: 0,
      jobId: 0,
      totalExperience: 0,
      relevantExperience: 0,
      currentCtc: 0,
      expectedCtc: 0,
      noticePeriod: '',
      comments: '',
      status: ApplicationStatus.Sourced,
    };
  }

  /**
   * Create application from call log
   */
  createApplication(): void {
    if (!this.applicationFormData.jobId) {
      alert('Please select a job');
      return;
    }

    this.creatingApplication = true;

    this.applicationService
      .createApplication(this.applicationFormData)
      .pipe(
        catchError((err) => {
          console.error('Error creating application:', err);
          alert('Failed to create application. Please try again.');
          this.creatingApplication = false;
          return throwError(() => err);
        }),
      )
      .subscribe({
        next: (response: Application) => {
          alert('Application created successfully!');
          this.closeCreateApplicationModal();
          // Reload call logs to refresh the view
          this.loadCallLogs();
        },
        error: (err) => {
          console.error('Application creation failed:', err);
          this.creatingApplication = false;
        },
        complete: () => {
          this.creatingApplication = false;
        },
      });
  }

  /**
   * Get badge color based on recruiter status
   */
  getStatusBadgeClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'Call back': 'bg-yellow-100 text-yellow-800',
      Sourced: 'bg-green-100 text-green-800',
      DNP: 'bg-red-100 text-red-800',
      'Recent Switch': 'bg-blue-100 text-blue-800',
      'Not looking for change': 'bg-gray-100 text-gray-800',
      'Not interested': 'bg-orange-100 text-orange-800',
      'Criteria mismatch': 'bg-purple-100 text-purple-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  reloadPage() {
    window.location.reload();
  }
}
