import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApplicationService } from '../../services/application.service';
import { JobsService } from '../../services/jobs.service';
import { ApplicationWithCandidateCreate, Job } from '../../models';
import { Observable, map } from 'rxjs';

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
  private jobsService = inject(JobsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  candidateForm: FormGroup;
  jobs$: Observable<Job[]>;

  constructor() {
    this.candidateForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      jobId: ['', Validators.required],
      totalExperience: ['', [Validators.required, Validators.min(0)]],
      relevantExperience: ['', [Validators.required, Validators.min(0)]],
      currentCtc: ['', Validators.required],
      expectedCtc: ['', Validators.required],
      noticePeriod: ['', Validators.required],
      currentLocation: ['', Validators.required],
      resumeUrl: [''],
      notes: [''],
    });

    this.jobs$ = this.jobsService
      .refreshJobs()
      .pipe(map(() => this.jobsService.currentJobsValue));
  }

  ngOnInit(): void {
    // Check if jobId is passed as query param
    const jobId = this.route.snapshot.queryParamMap.get('jobId');
    if (jobId) {
      this.candidateForm.patchValue({ jobId: +jobId });
    }
  }

  onSubmit() {
    if (this.candidateForm.valid) {
      const formValue = this.candidateForm.value;
      const candidateData: ApplicationWithCandidateCreate = {
        fullName: formValue.fullName,
        email: formValue.email,
        phone: formValue.phone,
        jobId: formValue.jobId,
        totalExperience: formValue.totalExperience,
        relevantExperience: formValue.relevantExperience,
        currentCtc: formValue.currentCtc,
        expectedCtc: formValue.expectedCtc,
        noticePeriod: formValue.noticePeriod,
        currentLocation: formValue.currentLocation,
        resumeUrl: formValue.resumeUrl,
        dynamicData: {}, // Can be extended for custom fields
        notes: formValue.notes,
      };

      this.applicationService
        .submitApplicationWithCandidate(candidateData)
        .subscribe({
          next: () => {
            this.router.navigate(['/candidates']);
          },
          error: (err) => {
            console.error('Failed to add candidate', err);
            // Handle error (show toast, etc.)
          },
        });
    }
  }
}
