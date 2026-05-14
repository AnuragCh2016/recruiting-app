import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApplicationService } from '../../services/application.service';
import { CandidateService } from '../../services/candidate.service';
import { CallLogService } from '../../services/call-log.service';
import { JobsService } from '../../services/jobs.service';
import { ResumeService } from '../../services/resume.service';
import {
  Job,
  RecruiterStatus,
  ApplicationStatus,
  CallLogCreate,
} from '../../models';
import { Observable, map, take } from 'rxjs';

@Component({
  selector: 'app-add-candidate',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-candidate.component.html',
  styleUrls: ['./add-candidate.component.css'],
})
export class AddCandidateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private applicationService = inject(ApplicationService);
  private candidateService = inject(CandidateService);
  private callLogService = inject(CallLogService);
  private jobsService = inject(JobsService);
  private resumeService = inject(ResumeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  candidateForm: FormGroup;
  dynamicDataGroup: FormGroup = this.fb.group({});
  jobHeaders: string[] = [];
  jobs$: Observable<Job[]>;
  loading = false;
  ref: string | null = '';
  // Track created IDs for retry logic
  createdCandidateId: number | null = null;
  createdApplicationId: number | null = null;
  createdCallLogId: number | null = null;
  private pendingResumeFile: File | null = null;
  private pendingFormValue: any = null;

  // Enums for dropdowns
  recruiterStatuses = Object.values(RecruiterStatus);
  applicationStatuses = Object.values(ApplicationStatus);

  // Helper to show/hide job section
  get showJobSection(): boolean {
    return !!this.candidateForm.get('addToJob')?.value;
  }

  // Helper to show/hide application section
  get showApplicationSection(): boolean {
    return (
      this.showJobSection &&
      this.candidateForm.get('recruiterStatus')?.value ===
        RecruiterStatus.Sourced
    );
  }

  constructor() {
    // 1. Updated Form Structure to match the DB Candidate Model
    this.candidateForm = this.fb.group({
      // Basic Info
      firstName: ['', Validators.required],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      gender: [''],
      dob: [''],

      // Professional Data
      currentLocation: ['', Validators.required],
      totalYearsExp: [0, [Validators.required, Validators.min(0)]],
      currentOrg: [''],
      currentDesignation: [''],
      keySkills: [''],

      // Education
      latestDegree: [''],
      latestSpecialization: [''],
      educationCompletionYear: [null],
      educationInstitute: [''],

      // Compensation & Timing
      currentCtc: [0, Validators.required],
      expectedCtc: [0],
      noticePeriod: ['', Validators.required],
      isCurrentlyWorking: [true],
      lastWorkingDay: [null],

      // Application/Job Context
      addToJob: [false],
      jobId: [''],
      recruiterStatus: [''],
      relevantExperience: [0, [Validators.required, Validators.min(0)]],
      resumeFile: [null, Validators.required],
      notes: [''],
    });

    this.jobs$ = this.jobsService
      .refreshJobs()
      .pipe(map(() => this.jobsService.currentJobsValue));
  }

  ngOnInit(): void {
    // debugger;
    this.ref = this.route.snapshot.queryParamMap.get('ref');
    if (!this.ref) return;

    // 1. Setup the listener FIRST
    const dataHandler = (event: any) => {
      const rawData = event.detail;
      if (rawData) {
        console.log('Successfully pulled from Extension Vault:', rawData);
        const normalized = this.mapCandidateData(rawData);

        // Use changeDetectorRef if the form doesn't update visually
        this.candidateForm.patchValue(normalized);
      } else {
        console.warn('Vault returned empty for ref:', this.ref);
      }
    };

    // Attach listener to window
    window.addEventListener('VAULT_DATA_RECEIVED', dataHandler, { once: true });

    // 2. Dispatch the request to content_ats.js
    // Give the bridge a tiny 50ms head start to ensure the listener is active
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('GET_VAULT_DATA', {
          detail: { key: this.ref },
        }),
      );
    }, 50);

    // Check for jobId in URL
    const jobIdParam = this.route.snapshot.queryParamMap.get('jobId');
    if (jobIdParam) {
      const jobId = +jobIdParam;
      this.candidateForm.patchValue({ jobId: jobId });
      this.setupDynamicFields(jobId);
    }

    // Listen for manual Job changes
    this.candidateForm.get('jobId')?.valueChanges.subscribe((id) => {
      if (id) this.setupDynamicFields(+id);
    });

    // Listen for addToJob changes to show/hide job section
    this.candidateForm.get('addToJob')?.valueChanges.subscribe((addToJob) => {
      const jobIdControl = this.candidateForm.get('jobId');
      if (addToJob) {
        jobIdControl?.setValidators([Validators.required]);
      } else {
        jobIdControl?.clearValidators();
        this.candidateForm.patchValue({ recruiterStatus: '' });
      }
      jobIdControl?.updateValueAndValidity();
    });

    // 3. The "Resume Upload" Pour: Handle AI parsed data
    this.resumeService.parsedData$.subscribe((data) => {
      if (data) this.populateParsedData(data);
    });

    // 4. Handle Binary File from ResumeService
    this.resumeService.resumeFile$.pipe(take(1)).subscribe((file) => {
      if (file) this.candidateForm.patchValue({ resumeFile: file });
    });
  }

  private checkExtensionData() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['capturedCandidate'], (result) => {
        // Use bracket notation here
        if (result['capturedCandidate']) {
          const normalized = this.mapCandidateData(result['capturedCandidate']);
          this.candidateForm.patchValue(normalized);
          console.log('Form pre-filled from Extension Data');
        }
      });
    }
  }

  private setupDynamicFields(jobId: number) {
    const selectedJob = this.jobsService.currentJobsValue.find(
      (j) => j.id === jobId,
    );
    if (selectedJob && selectedJob.trackerHeaders) {
      this.jobHeaders = selectedJob.trackerHeaders;
      const group: any = {};
      this.jobHeaders.forEach((h) => (group[h] = new FormControl('')));
      this.dynamicDataGroup = this.fb.group(group);
    }
  }

  private populateParsedData(data: any) {
    // Map main form fields
    this.candidateForm.patchValue({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone, // Matching the Gemini JSON key
      currentLocation: data.currentLocation,
      // Mapping detailed AI snippets to notes as a fallback
      notes: `Education: ${data.dynamic_data?.['Education'] || 'N/A'}\nExperience: ${data.dynamic_data?.['Current Organization'] || 'N/A'}`,
    });

    // Map Dynamic Fields if they exist in the parsed response
    if (data.dynamic_data && this.jobHeaders.length > 0) {
      const dynamicUpdate: any = {};
      this.jobHeaders.forEach((header) => {
        if (data.dynamic_data[header] !== undefined) {
          dynamicUpdate[header] = data.dynamic_data[header];
        }
      });
      this.dynamicDataGroup.patchValue(dynamicUpdate);
    }
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.candidateForm.patchValue({ resumeFile: file });
    }
  }

  onSubmit() {
    // clearly candidate data has been fetched, absolutely safe to delete now
    window.dispatchEvent(
      new CustomEvent('DELETE_VAULT_DATA', {
        detail: { key: this.ref },
      }),
    );

    if (this.candidateForm.valid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.loading = true;
      const formValue = { ...this.candidateForm.value };
      const fileToUpload = formValue.resumeFile;
      this.pendingResumeFile = fileToUpload;

      // Separate file from the structured data
      delete formValue.resumeFile;
      this.pendingFormValue = formValue;

      // Determine what needs to be created based on existing IDs
      const needsCandidate = !this.createdCandidateId;
      const needsCallLog = formValue.addToJob && !this.createdCallLogId;
      const needsApplication =
        formValue.addToJob &&
        formValue.recruiterStatus === RecruiterStatus.Sourced &&
        !this.createdApplicationId;

      if (needsCandidate) {
        // Step 1: Create Candidate
        this.createCandidate(formValue, needsApplication, needsCallLog);
      } else {
        // Candidate already exists
        if (needsCallLog) {
          this.createCallLog(formValue, needsApplication);
        } else if (needsApplication) {
          // Call log already done, just create application
          this.createApplication(formValue);
        } else {
          // Nothing to do — just navigate
          this.finishSubmission();
        }
      }
    }
  }

  private createCandidate(
    formValue: any,
    needsApplication: boolean,
    needsCallLog: boolean,
  ): void {
    const candidatePayload = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
      gender: formValue.gender,
      dob: formValue.dob,
      currentLocation: formValue.currentLocation,
      totalYearsExp: formValue.totalYearsExp,
      currentOrg: formValue.currentOrg,
      currentDesignation: formValue.currentDesignation,
      latestDegree: formValue.latestDegree,
      latestSpecialization: formValue.latestSpecialization,
      educationCompletionYear: formValue.educationCompletionYear,
      educationInstitute: formValue.educationInstitute,
      currentCtc: formValue.currentCtc,
      expectedCtc: formValue.expectedCtc,
      noticePeriod: formValue.noticePeriod,
      isCurrentlyWorking: formValue.isCurrentlyWorking,
      lastWorkingDay: formValue.lastWorkingDay,
      keySkills: formValue.keySkills,
    };

    this.candidateService.createCandidate(candidatePayload).subscribe({
      next: (response: any) => {
        // Extract candidate ID from response
        this.createdCandidateId = response.id || response.data?.id;
        console.log('Candidate created with ID:', this.createdCandidateId);

        if (this.createdCandidateId !== null) {
          // Upload resume immediately after candidate is created
          this.handleResumeUpload(this.createdCandidateId, null, false);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Candidate creation failed', err);
        if (err.status === 400) {
          alert(
            'Candidate with this phone number already exists. Please search for the candidate first.',
          );
        } else {
          alert('Failed to create candidate. Please try again.');
        }
        // Don't stop - user can retry and the flow will continue from where it left off
      },
    });
  }

  private createApplication(formValue: any): void {
    if (this.createdCandidateId === null) {
      console.error('Cannot create application without candidate ID');
      this.loading = false;
      return;
    }

    const applicationPayload = {
      candidateId: this.createdCandidateId,
      jobId: +formValue.jobId,
      totalExperience: formValue.totalYearsExp,
      relevantExperience: formValue.relevantExperience,
      currentCtc: formValue.currentCtc,
      expectedCtc: formValue.expectedCtc,
      noticePeriod: formValue.noticePeriod,
      comments: formValue.notes,
      status: ApplicationStatus.Sourced,
    };

    this.applicationService.createApplication(applicationPayload).subscribe({
      next: (response: any) => {
        // Extract application ID from response
        this.createdApplicationId =
          response.id ||
          response.data?.applicationId ||
          response.data?.application_id;
        console.log('Application created with ID:', this.createdApplicationId);

        this.finishSubmission();
      },
      error: (err) => {
        this.loading = false;
        console.error('Application creation failed', err);
        alert(
          'Candidate and call log created, but failed to create application. Please try again.',
        );
        // Candidate was created - navigate to search page
        this.router.navigate(['/candidates']);
      },
    });
  }

  private createCallLog(formValue: any, needsApplication: boolean): void {
    if (this.createdCandidateId === null) {
      console.error('Cannot create call log without candidate ID');
      this.loading = false;
      return;
    }

    const callLogPayload: CallLogCreate = {
      candidateId: this.createdCandidateId,
      // userId: 0, // Will be set by backend from JWT token
      associatedJobId: formValue.addToJob ? +formValue.jobId : 0,
      applicationId:
        this.createdApplicationId !== null
          ? this.createdApplicationId
          : undefined,
      recruiterStatus: formValue.recruiterStatus,
      comments: formValue.notes || 'Candidate added via form',
    };

    this.callLogService.createCallLog(callLogPayload).subscribe({
      next: (response) => {
        this.createdCallLogId = response.data?.id;
        console.log('Call log created with ID:', this.createdCallLogId);

        // If recruiter status is Sourced, create application next
        if (needsApplication) {
          this.createApplication(formValue);
        } else {
          this.finishSubmission();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Call log creation failed', err);
        alert(
          'Candidate created, but failed to create call log. Please try again.',
        );
        // Candidate was created - navigate to search page
        this.router.navigate(['/candidates']);
      },
    });
  }

  private handleResumeUpload(
    candidateId: number,
    file: File | null,
    allOperationsComplete: boolean,
  ): void {
    const fileToUpload = file || this.pendingResumeFile;
    const doNext = () => {
      // After resume upload (or skip), proceed to call log only if addToJob was checked
      if (this.createdCandidateId !== null && this.pendingFormValue) {
        if (this.pendingFormValue.addToJob) {
          const needsApp =
            this.pendingFormValue.recruiterStatus === RecruiterStatus.Sourced &&
            !this.createdApplicationId;
          this.createCallLog(this.pendingFormValue, needsApp);
        } else {
          this.finishSubmission();
        }
      }
    };

    if (fileToUpload) {
      // Upload resume to candidate endpoint
      this.candidateService.uploadResume(candidateId, fileToUpload).subscribe({
        next: () => {
          doNext();
        },
        error: (err: any) => {
          this.loading = false;
          alert('Candidate created, but resume upload failed.');
          doNext();
        },
      });
    } else {
      // No resume, just proceed
      doNext();
    }
  }

  private finishSubmission(): void {
    this.loading = false;
    this.resumeService.clearData();
    this.router.navigate(['/candidates']);
  }

  // Define a central mapping method
  private mapCandidateData(raw: any) {
    const source = raw.__source;

    if (source === 'naukri_rms') {
      return this.mapNaukriRmsToForm(raw);
    }

    // Default to existing Resdex mapper
    return this.mapNaukriResdexToForm(raw);
  }

  // New method for /applications
  private mapNaukriRmsToForm(raw: any) {
    const nameParts = (raw.name || '').trim().split(' ');
    const currentJob = raw.workExp?.[0] || {};
    const latestEdu = raw.education?.[0] || {};

    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: raw.email || '',
      phone: raw.phoneNumber?.[0]?.value || '',
      gender: raw.otherDetails?.personal?.gender || '',
      dob: raw.otherDetails?.personal?.dob || '',
      currentLocation: raw.currentCity || '',
      totalYearsExp: parseFloat(raw.experience?.years || 0),
      currentOrg: currentJob.company || '',
      currentDesignation: currentJob.designation || '',
      latestDegree: latestEdu.degree || '',
      latestSpecialization: latestEdu.specialization || '',
      educationCompletionYear: latestEdu.year || null,
      currentCtc: parseFloat(raw.ctc?.lacs || 0),
      expectedCtc: parseFloat(raw.expectedCtc?.lacs || 0),
      noticePeriod: raw.noticePeriod || '',
      isCurrentlyWorking: currentJob.current === '1',
      keySkills: raw.keySkills || '',
      // Add specific fields only found in /applications
      applicationId: raw.applicationId,
      jobId: raw.jobId,
    };
  }

  /**
   * Maps raw Naukri JSON to the Candidate form structure
   */
  private mapNaukriResdexToForm(raw: any) {
    // Name Splitting
    const nameParts = (raw.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Find Highest Education
    const educations = raw.educations || [];
    const latestEdu = educations.reduce((prev: any, current: any) => {
      return parseInt(current.yearOfCompletion) >
        parseInt(prev.yearOfCompletion)
        ? current
        : prev;
    }, educations[0] || {});

    // Current Work Exp
    const currentJob = raw.workExperiences?.[0] || {};

    return {
      firstName: firstName,
      lastName: lastName,
      email: raw.email || '',
      phone: raw.rphone?.replace(/\+/g, '').trim() || '',
      gender: raw.gender || '',
      dob: raw.birthDate || '',
      currentLocation: raw.city || '',
      totalYearsExp: parseFloat(raw.rawTotalExperience || 0),
      currentOrg: currentJob.organization || '',
      currentDesignation: currentJob.designation || '',
      latestDegree: latestEdu.course?.label || '',
      latestSpecialization: latestEdu.spec?.label || '',
      educationCompletionYear: latestEdu.yearOfCompletion
        ? parseInt(latestEdu.yearOfCompletion)
        : null,
      educationInstitute: latestEdu.institute?.label || '',
      currentCtc: parseFloat(raw.ctcValue || 0),
      expectedCtc: parseFloat(raw.expectedCtcValue || 0),
      noticePeriod: raw.noticePeriod || '',
      isCurrentlyWorking: currentJob.endDate === 'till date',
      keySkills: raw.keywords || '',
    };
  }
}
