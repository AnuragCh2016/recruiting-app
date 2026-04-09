import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JobsService } from '../../services/jobs.service';

@Component({
  selector: 'app-add-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-job.component.html',
  styleUrls: ['./add-job.component.css'],
})
export class AddJobComponent implements OnInit {
  private fb = inject(FormBuilder);
  private jobsService = inject(JobsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  jobForm: FormGroup;
  isEditMode = false;
  jobId: number | null = null;
  customFields: string[] = [];
  loading = false;

  constructor() {
    this.jobForm = this.fb.group({
      roleTitle: ['', Validators.required],
      jobCode: ['', Validators.required],
      clientName: ['', Validators.required],
      location: ['', Validators.required],
      minExp: ['', [Validators.required, Validators.min(0)]],
      maxExp: ['', [Validators.required, Validators.min(0)]],
      minCompensation: [''],
      maxCompensation: [''],
      cooldownPeriod: [''],
      description: ['', Validators.required],
      jdFile: [null],
      trackerHeaders: [[]],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.jobId = +id;

      this.jobsService.getJob(this.jobId).subscribe({
        next: (job) => {
          if (job) {
            this.jobForm.patchValue(job);
            this.customFields = job.trackerHeaders || [];
          }
        },
        error: (err) => console.error('Could not fetch job details', err),
      });
    }
  }

  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length !== 1) return;

    // The "Master Map" of synonyms to Core Database Fields
    const coreFieldMap: { [key: string]: string } = {
      name: 'fullName',
      mobile: 'phone',
      phone: 'phone',
      'e mail': 'email',
      email: 'email',
      ctc: 'currentCtc',
      'current ctc': 'currentCtc',
      fixed: 'fixedCtc',
      variable: 'variableCtc',
      ectc: 'expectedCtc',
      'expected ctc': 'expectedCtc',
      np: 'noticePeriod',
      'notice period': 'noticePeriod',
      'exp (yrs.)': 'totalExperience',
      experience: 'totalExperience',
      'total exp': 'totalExperience',
    };

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      import('xlsx').then((XLSX) => {
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = <any[][]>XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data && data.length > 0) {
          const rawHeaders = data[0].map((h) => String(h).trim());

          // Logic: Keep it ONLY if it's NOT a Core Field
          this.customFields = rawHeaders.filter((h) => {
            if (!h) return false;
            const normalized = h.toLowerCase();
            return !coreFieldMap.hasOwnProperty(normalized);
          });

          this.jobForm.patchValue({ trackerHeaders: this.customFields });
        }
      });
    };
    reader.readAsBinaryString(target.files[0]);
  }

  onJdFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PDF or DOCX file.');
        return;
      }
      this.jobForm.patchValue({ jdFile: file });
    }
  }

  removeCustomField(index: number) {
    this.customFields.splice(index, 1);
    this.jobForm.patchValue({ trackerHeaders: this.customFields });
  }

  onSubmit() {
    if (this.jobForm.valid) {
      this.loading = true;
      const formValue = { ...this.jobForm.value };

      // Sync customFields
      formValue.trackerHeaders = this.customFields;

      const jdFile = formValue.jdFile;
      delete formValue.jdFile;

      if (this.isEditMode && this.jobId) {
        this.jobsService.updateJob({ ...formValue, id: this.jobId }).subscribe({
          next: () => this.handleJdUpload(this.jobId!, jdFile),
          error: (err) => this.handleError(err),
        });
      } else {
        // Interceptor handles camelCase -> snake_case

        this.jobsService.addJob(formValue).subscribe({
          next: (res) => {
            // Generic response returns the new ID here
            this.handleJdUpload(res.data.id, jdFile);
          },
          error: (err) => this.handleError(err),
        });
      }
    }
  }

  private handleJdUpload(jobId: number, file: File | null) {
    if (file) {
      this.jobsService.uploadJd(jobId, file).subscribe({
        next: () => this.navigateHome(),
        error: (err) => {
          alert('Job saved, but JD upload failed.');
          this.navigateHome();
        },
      });
    } else {
      this.navigateHome();
    }
  }

  private navigateHome() {
    this.loading = false;
    this.router.navigate(['/jobs']);
  }

  private handleError(err: any) {
    this.loading = false;
    alert(err.error?.message || 'An error occurred.');
  }
}
