import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CandidateDetailsRead,
  Job,
  ApplicationStatus,
  RecruiterStatus,
  ApplicationSummary,
} from '../../models';
import { Observable, map, catchError, of } from 'rxjs';
import { CandidateService } from '../../services/candidate.service';
import { ApplicationService } from '../../services/application.service';
import { CallLogService } from '../../services/call-log.service';
import { JobsService } from '../../services/jobs.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-candidate-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.css'],
})
export class CandidateListComponent implements OnInit {
  private candidateService = inject(CandidateService);
  private applicationService = inject(ApplicationService);
  private callLogService = inject(CallLogService);
  private jobsService = inject(JobsService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  fetchError: boolean = false;
  jobs$: Observable<Job[]>;
  searchForm: FormGroup;
  isSearching = false;
  searchResults: CandidateDetailsRead[] = [];
  loadingSearch = false;

  // Pagination
  currentPage = 1;
  pageSize = 5;

  get totalPages(): number {
    return Math.ceil(this.searchResults.length / this.pageSize) || 1;
  }

  get paginatedResults(): CandidateDetailsRead[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.searchResults.slice(start, start + this.pageSize);
  }

  get showingFrom(): number {
    return this.searchResults.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.searchResults.length,
    );
  }

  // Modal state
  showAddToJobModal = false;
  addToJobForm: FormGroup;
  selectedCandidate: CandidateDetailsRead | null = null;
  submitted = false;
  loading = false;

  // View Applications Modal state
  showViewAppsModal = false;
  candidateApplications: ApplicationSummary[] = [];
  loadingApps = false;
  appsFetchError = false;

  // Enums
  applicationStatuses = Object.values(ApplicationStatus);
  recruiterStatuses = Object.values(RecruiterStatus);

  constructor() {
    this.jobs$ = this.jobsService
      .refreshJobs()
      .pipe(map(() => this.jobsService.currentJobsValue));

    // Initialize the form
    this.addToJobForm = this.fb.group({
      jobId: ['', Validators.required],
      relevantExperience: [0],
      currentCtc: [0],
      expectedCtc: [0],
      noticePeriod: [''],
      applicationStatus: [ApplicationStatus.Sourced],
      recruiterStatus: [RecruiterStatus.Sourced],
      comments: [''],
    });

    // Initialize search form
    this.searchForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      phone: [''],
      mustHaveSkills: [''],
      niceToHaveSkills: [''],
      minExp: [null],
      maxExp: [null],
      minCtc: [null],
      maxCtc: [null],
      noticePeriod: [''],
    });
  }

  ngOnInit(): void {}

  performSearch(): void {
    const formValue = this.searchForm.value;

    this.currentPage = 1;
    this.loadingSearch = true;
    this.isSearching = true;

    // Build search payload - include only non-empty values
    const searchPayload: any = {};
    if (formValue.firstName) searchPayload.first_name = formValue.firstName;
    if (formValue.lastName) searchPayload.last_name = formValue.lastName;
    if (formValue.email) searchPayload.email = formValue.email;
    if (formValue.phone) searchPayload.phone = formValue.phone;
    if (formValue.mustHaveSkills) {
      searchPayload.must_have_skills = formValue.mustHaveSkills
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    }
    if (formValue.niceToHaveSkills) {
      searchPayload.nice_to_have_skills = formValue.niceToHaveSkills
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    }
    if (formValue.minExp !== null && formValue.minExp !== undefined)
      searchPayload.min_exp = formValue.minExp;
    if (formValue.maxExp !== null && formValue.maxExp !== undefined)
      searchPayload.max_exp = formValue.maxExp;
    if (formValue.minCtc !== null && formValue.minCtc !== undefined)
      searchPayload.min_ctc = formValue.minCtc;
    if (formValue.maxCtc !== null && formValue.maxCtc !== undefined)
      searchPayload.max_ctc = formValue.maxCtc;
    if (formValue.noticePeriod)
      searchPayload.notice_period = formValue.noticePeriod;

    this.candidateService.searchCandidates(searchPayload).subscribe({
      next: (results) => {
        console.log('Search results received:', results);
        console.log('Number of results:', results?.length);
        if (results && results.length > 0) {
          console.log('First candidate:', results[0]);
        }
        this.searchResults = results || [];
        this.loadingSearch = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.loadingSearch = false;
        this.fetchError = true;
      },
    });
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.searchResults = [];
    this.isSearching = false;
    this.fetchError = false;
    this.currentPage = 1;
  }

  searchAll(): void {
    this.searchForm.reset();
    this.performSearch();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // Smooth scroll the results panel to top
      const resultsPanel = document.querySelector('.col-span-9');
      if (resultsPanel) {
        resultsPanel.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  reloadPage() {
    window.location.reload();
  }

  getSkillColorClass(index: number): string {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-gray-100 text-gray-800',
    ];
    return colors[index % colors.length];
  }

  getLimitedSkills(skills: string[], max: number = 4): string[] {
    if (!skills || !Array.isArray(skills)) {
      return [];
    }
    return skills.slice(0, max);
  }

  hasMoreSkills(skills: string[], max: number = 4): boolean {
    if (!skills || !Array.isArray(skills)) {
      return false;
    }
    return skills.length > max;
  }

  getRowClass(index: number): string {
    return index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
  }

  getCardRowClass(index: number): string {
    return index % 2 === 0
      ? 'bg-white hover:bg-gray-50'
      : 'bg-gray-50 hover:bg-white';
  }

  getInitials(firstName: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'C';
  }

  navigateToCandidate(id: number): void {
    this.router.navigate(['/candidates', id]);
  }

  onAddToJob(candidate: CandidateDetailsRead): void {
    this.selectedCandidate = candidate;
    this.showAddToJobModal = true;
    this.submitted = false;

    // Pre-fill form with candidate data (fetch full details first)
    this.candidateService.getCandidateById(candidate.id).subscribe({
      next: (fullCandidate) => {
        this.addToJobForm.patchValue({
          relevantExperience: fullCandidate.totalYearsExp || 0,
          currentCtc: fullCandidate.currentCtc || 0,
          expectedCtc: fullCandidate.expectedCtc || 0,
          noticePeriod: fullCandidate.noticePeriod || '',
        });
      },
      error: (err) => {
        console.error('Failed to fetch candidate details', err);
        // Still allow modal to open, just without pre-filled data
      },
    });
  }

  get f() {
    return this.addToJobForm.controls;
  }

  closeModal(): void {
    this.showAddToJobModal = false;
    this.selectedCandidate = null;
    this.submitted = false;
    this.addToJobForm.reset();
  }

  // --- View Applications Modal ---

  onViewApplications(candidate: CandidateDetailsRead): void {
    this.selectedCandidate = candidate;
    this.showViewAppsModal = true;
    this.loadingApps = true;
    this.appsFetchError = false;
    this.candidateApplications = [];

    this.applicationService.getApplicationsByCandidate(candidate.id).subscribe({
      next: (apps) => {
        this.candidateApplications = apps;
        this.loadingApps = false;
      },
      error: (err) => {
        console.error('Error fetching candidate applications:', err);
        this.loadingApps = false;
        this.appsFetchError = true;
      },
    });
  }

  closeViewAppsModal(): void {
    this.showViewAppsModal = false;
    this.selectedCandidate = null;
    this.candidateApplications = [];
    this.appsFetchError = false;
  }

  getAppStatusColorClass(status: string): string {
    const statusColors: { [key: string]: string } = {
      Sourced: 'bg-blue-100 text-blue-800',
      Shared: 'bg-yellow-100 text-yellow-800',
      'In Process': 'bg-purple-100 text-purple-800',
      'Offer Released': 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Joined: 'bg-emerald-100 text-emerald-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  submitAddToJob(): void {
    this.submitted = true;

    if (this.addToJobForm.invalid || !this.selectedCandidate) {
      return;
    }

    this.loading = true;
    const formValue = this.addToJobForm.getRawValue();
    const isSourced = formValue.recruiterStatus === RecruiterStatus.Sourced;

    // Step 1: Create Call Log (always)
    const callLogPayload = {
      candidateId: this.selectedCandidate!.id,
      associatedJobId: +formValue.jobId,
      recruiterStatus: formValue.recruiterStatus,
      comments: formValue.comments || 'Application created from candidate list',
    };

    console.log('Creating call log with payload:', callLogPayload);
    this.callLogService.createCallLog(callLogPayload).subscribe({
      next: (callLogResponse) => {
        console.log('Call log response:', callLogResponse);

        // Step 2: If Sourced, create application
        if (isSourced) {
          const applicationPayload = {
            candidateId: this.selectedCandidate!.id,
            jobId: +formValue.jobId,
            relevantExperience: formValue.relevantExperience,
            currentCtc: formValue.currentCtc,
            expectedCtc: formValue.expectedCtc,
            noticePeriod: formValue.noticePeriod,
            comments: formValue.comments,
            status: ApplicationStatus.Sourced,
          };

          console.log('Creating application with payload:', applicationPayload);
          this.applicationService
            .createApplication(applicationPayload)
            .subscribe({
              next: (appResponse: any) => {
                console.log(
                  'Application response:',
                  JSON.stringify(appResponse),
                );
                this.loading = false;
                alert('Call log and application created successfully!');
                this.closeModal();
              },
              error: (err) => {
                this.loading = false;
                console.error('Application creation failed', err);
                alert('Call log created, but failed to create application.');
                this.closeModal();
              },
            });
        } else {
          this.loading = false;
          alert('Call log created successfully!');
          this.closeModal();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Call log creation failed', err);
        if (err.status === 401) {
          alert('Authentication failed. Please login again.');
        } else {
          alert('Failed to create call log. Please try again.');
        }
      },
    });
  }
}
