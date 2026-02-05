import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CandidatesService } from '../../services/candidates.service';
import { JobsService } from '../../services/jobs.service';
import { Candidate, Job } from '../../models';
import { Observable, startWith, map } from 'rxjs';

@Component({
  selector: 'app-add-candidate',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-candidate.component.html',
  styleUrls: ['./add-candidate.component.css']
})
export class AddCandidateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private candidatesService = inject(CandidatesService);
  private jobsService = inject(JobsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  candidateForm: FormGroup;
  // jobs$ removed as filteredJobs$ is used
  isEditMode = false;

  jobSearchControl = new FormControl('');
  filteredJobs$: Observable<Job[]>;
  selectedJob: Job | null = null;

  constructor() {
    this.filteredJobs$ = this.jobsService.jobs$.pipe(
      map(jobs => jobs)
    );

    this.candidateForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      jobId: [null, Validators.required],
      totalExperience: ['', [Validators.required, Validators.pattern(/^[0-9]*\.?[0-9]+$/)]], 
      relevantExperience: ['', [Validators.required, Validators.pattern(/^[0-9]*\.?[0-9]+$/)]],
      currentCtc: ['', [Validators.required, Validators.pattern(/^[0-9]*\.?[0-9]+$/)]],
      expectedCtc: ['', [Validators.required, Validators.pattern(/^[0-9]*\.?[0-9]+$/)]],
      noticePeriod: ['', Validators.required],
      location: ['', Validators.required],
      status: ['Sourced', Validators.required],
      notes: ['']
    });

    // Setup job search
    this.filteredJobs$ = this.jobSearchControl.valueChanges.pipe(
      startWith(''),
      map(term => {
        const searchTerm = (term || '').toLowerCase();
        
        // Logic 3: Clear selection if user deletes text
        if (!searchTerm && this.selectedJob) {
             this.selectedJob = null;
             this.candidateForm.patchValue({ jobId: null });
        }

        if (searchTerm.length < 3) {
            return [];
        }
        // Access BehaviorSubject value directly
        return this.jobsService.jobs$.getValue().filter(job => 
          job.title.toLowerCase().includes(searchTerm) || 
          job.jobCode.toLowerCase().includes(searchTerm) ||
          job.id.toString().includes(searchTerm)
        );
      })
    );
  }

  candidateId: number | null = null;
  submitError: string | null = null;

  ngOnInit(): void {
    const jobIdParam = this.route.snapshot.queryParamMap.get('jobId');
    if (jobIdParam) {
      this.candidateForm.patchValue({ jobId: +jobIdParam });
      const job = this.jobsService.getJob(+jobIdParam);
      if (job) {
        this.selectedJob = job;
        this.jobSearchControl.setValue(job.title); // Pre-fill search
        this.setupDynamicFields(job);
      }
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.candidateId = +idParam;
      const candidate = this.candidatesService.getCandidate(this.candidateId);
      if (candidate) {
        this.candidateForm.patchValue(candidate);
        const job = this.jobsService.getJob(candidate.jobId);
        if (job) {
          this.selectedJob = job;
          this.jobSearchControl.setValue(job.title);
          this.setupDynamicFields(job);
        }
      }
    }
  }

  selectJob(job: Job) {
    this.selectedJob = job;
    this.candidateForm.patchValue({ jobId: job.id });
    this.jobSearchControl.setValue(job.title, { emitEvent: false }); // Don't trigger search again
    
    this.setupDynamicFields(job);
  }

  setupDynamicFields(job: Job) {
    // Remove existing dynamicData group if any
    if (this.candidateForm.contains('dynamicData')) {
      this.candidateForm.removeControl('dynamicData');
    }

    if (job.customFields && job.customFields.length > 0) {
      const dynamicGroup = this.fb.group({});
      job.customFields.forEach(field => {
        // Simple text control for now
        // Check if we are in edit mode and have data
        let initialValue = '';
        if (this.isEditMode && this.candidateId) {
            const candidate = this.candidatesService.getCandidate(this.candidateId);
            if (candidate && candidate.dynamicData) {
                initialValue = candidate.dynamicData[field] || '';
            }
        }
        dynamicGroup.addControl(field, this.fb.control(initialValue));
      });
      this.candidateForm.addControl('dynamicData', dynamicGroup);
    }
  }

  get dynamicDataGroup(): FormGroup {
    return this.candidateForm.get('dynamicData') as FormGroup;
  }

  get customFields(): string[] {
    return this.selectedJob?.customFields || [];
  }

  onSubmit() {
    this.submitError = null;
    if (this.candidateForm.valid) {
      const formValue = this.candidateForm.value;
      formValue.jobId = Number(formValue.jobId);

      // Handle rejected status logic
      if (formValue.status === 'Rejected') {
          formValue.rejectedOn = new Date();
      } else {
          delete formValue.rejectedOn;
      }

      // Duplicate Check
      if (!this.isEditMode) {
        const isDuplicate = this.candidatesService.checkDuplicate(formValue.jobId, formValue.email, formValue.phone);
        if (isDuplicate) {
          this.submitError = 'Duplicate Candidate! A candidate with this email or phone already exists for this job.';
          return;
        }
      }
      
      if (this.isEditMode && this.candidateId) {
        this.candidatesService.updateCandidate({ ...formValue, id: this.candidateId });
      } else {
        this.candidatesService.addCandidate(formValue);
        const currentJob = this.jobsService.getJob(formValue.jobId);
        if (currentJob) {
          this.jobsService.updateCandidateCount(formValue.jobId, (currentJob.candidateCount || 0) + 1);
        }
      }

      this.router.navigate(['/candidates']);
    } else {
      this.candidateForm.markAllAsTouched();
      this.submitError = 'Please fill in all mandatory fields correctly.';
    }
  }
}
