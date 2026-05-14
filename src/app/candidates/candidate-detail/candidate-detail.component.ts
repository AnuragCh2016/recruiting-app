import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormControl,
  FormsModule,
} from '@angular/forms';
import { CandidateService } from '../../services/candidate.service';
import { CandidateDetailsRead } from '../../models';
import { Observable, of, map, switchMap, catchError, tap } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-candidate-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './candidate-detail.component.html',
  styleUrls: ['./candidate-detail.component.css'],
})
export class CandidateDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private candidateService = inject(CandidateService);

  candidate$: Observable<CandidateDetailsRead | undefined>;
  fetchError: boolean = false;

  // Form handling
  candidateForm: FormGroup;
  isEditMode = false;
  selectedFile: File | null = null;

  // Resume url for iframe
  private sanitizer = inject(DomSanitizer);
  safeResumeUrl: SafeResourceUrl | null = null;

  constructor() {
    // Initialize the base form matching add-candidate
    this.candidateForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      phone: [''],
      gender: [''],
      currentLocation: [''],
      currentOrg: [''],
      currentDesignation: [''],
      totalYearsExp: [0],
      relevantExperience: [0],
      keySkills: [''],
      latestDegree: [''],
      latestSpecialization: [''],
      educationInstitute: [''],
      educationCompletionYear: [null],
      currentCtc: [null],
      expectedCtc: [null],
      noticePeriod: [''],
      isCurrentlyWorking: [true],
      notes: [''],
    });

    // Setup the data stream
    const candidateId$ = this.route.paramMap.pipe(
      map((params) => Number(params.get('id'))),
    );

    this.candidate$ = candidateId$.pipe(
      switchMap((id) =>
        this.candidateService.getCandidateById(id).pipe(
          tap((data) => {
            this.initializeForm(data);
          }),
          map((data) => data),
          catchError((err) => {
            this.fetchError = true;
            return of(undefined);
          }),
        ),
      ),
    );
  }

  ngOnInit(): void {}

  private initializeForm(data: CandidateDetailsRead) {
    // Patch the main form
    this.candidateForm.patchValue({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      currentLocation: data.currentLocation,
      currentOrg: data.currentOrg,
      currentDesignation: data.currentDesignation,
      totalYearsExp: data.totalYearsExp,
      keySkills: data.keySkills?.join(', '),
      latestDegree: data.latestDegree,
      latestSpecialization: data.latestSpecialization,
      educationCompletionYear: data.educationCompletionYear,
      currentCtc: data.currentCtc,
      expectedCtc: data.expectedCtc,
      noticePeriod: data.noticePeriod,
      isCurrentlyWorking: data.isCurrentlyWorking,
      notes: '', // Assuming notes not in CandidateDetailRead
    });

    this.candidateForm.disable(); // Ensure everything starts read-only
    this.isEditMode = false;

    // Set safe URL for iframe PDF preview
    if (data.resumeUrl && this.isPdfResume(data.resumeUrl)) {
      this.safeResumeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        data.resumeUrl,
      );
    } else {
      this.safeResumeUrl = null;
    }
  }

  toggleEdit() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.candidateForm.enable();
    } else {
      this.candidateForm.disable();
      this.selectedFile = null; // Reset file selection when canceling edit
    }
  }

  saveChanges() {
    const rawValue = this.candidateForm.getRawValue();
    const updatedData: any = {
      firstName: rawValue.firstName,
      lastName: rawValue.lastName,
      email: rawValue.email,
      phone: rawValue.phone,
      gender: rawValue.gender,
      currentLocation: rawValue.currentLocation,
      currentOrg: rawValue.currentOrg,
      currentDesignation: rawValue.currentDesignation,
      totalYearsExp: rawValue.totalYearsExp,
      latestDegree: rawValue.latestDegree,
      latestSpecialization: rawValue.latestSpecialization,
      educationCompletionYear: rawValue.educationCompletionYear,
      educationInstitute: rawValue.educationInstitute,
      currentCtc: rawValue.currentCtc,
      expectedCtc: rawValue.expectedCtc,
      noticePeriod: rawValue.noticePeriod,
      isCurrentlyWorking: rawValue.isCurrentlyWorking,
    };

    // Handle keySkills: keep as comma-separated string for the backend
    if (rawValue.keySkills) {
      updatedData.keySkills = rawValue.keySkills;
    }

    // Remove null/undefined values
    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] === null || updatedData[key] === undefined) {
        delete updatedData[key];
      }
    });

    this.candidateService
      .updateCandidate(this.candidateId, updatedData)
      .subscribe({
        next: () => {
          // If a new resume file was selected, upload it separately
          if (this.selectedFile) {
            this.candidateService
              .uploadResume(this.candidateId, this.selectedFile)
              .subscribe({
                next: () => this.finishEdit(),
                error: (err) => {
                  console.error('Resume upload failed', err);
                  alert('Profile updated, but resume upload failed.');
                  this.finishEdit();
                },
              });
          } else {
            this.finishEdit();
          }
        },
        error: (err) => {
          console.error('Update failed', err);
          alert(err.error?.message || 'Failed to update candidate.');
        },
      });
  }

  private finishEdit() {
    this.isEditMode = false;
    this.candidateForm.disable();
    this.selectedFile = null;
    // Refresh the candidate data
    this.candidate$ = this.candidateService.getCandidateById(this.candidateId);
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

  get candidateId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  getFileName(url: string): string {
    const filename = url.split('/').pop() || 'Resume';
    return filename.split('?')[0];
  }

  isPdfResume(url: string): boolean {
    const filename = this.getFileName(url).toLowerCase();
    return filename.endsWith('.pdf');
  }

  encodeUrl(url: string): string {
    // We use the built-in encodeURIComponent to handle special characters (?, &, =)
    return encodeURIComponent(url);
  }
}
