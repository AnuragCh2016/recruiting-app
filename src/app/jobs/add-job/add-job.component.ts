import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JobsService } from '../../services/jobs.service';
import { Job } from '../../models';

@Component({
  selector: 'app-add-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-job.component.html',
  styleUrls: ['./add-job.component.css']
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

  constructor() {
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      jobCode: ['', Validators.required],
      companyName: ['', Validators.required],
      location: ['', Validators.required],
      minExperience: ['', [Validators.required, Validators.min(0)]],
      maxExperience: ['', [Validators.required, Validators.min(0)]],
      minSalary: [''],
      maxSalary: [''],
      cooldownPeriod: [''],
      description: ['', Validators.required],
      customFields: [[]] // Store array of strings
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.jobId = +id;
      const job = this.jobsService.getJob(this.jobId);
      if (job) {
        this.jobForm.patchValue(job);
        if (job.customFields) {
          this.customFields = job.customFields;
        }
      }
    }
  }

  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      import('xlsx').then(XLSX => {
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = <any[][]>(XLSX.utils.sheet_to_json(ws, { header: 1 }));
        
        if (data && data.length > 0) {
           // First row is headers
           const headers = data[0].map(h => String(h));
           // Filter out standard fields if we want, or just keep all as "sourced" fields
           // For now, let's keep all non-empty headers
           this.customFields = headers.filter(h => h && h.trim().length > 0);
           this.jobForm.patchValue({ customFields: this.customFields });
        }
      });
    };
    reader.readAsBinaryString(target.files[0]);
  }

  onSubmit() {
    if (this.jobForm.valid) {
      const formValue = this.jobForm.value;
      // Ensure customFields is set
      formValue.customFields = this.customFields;

      if (this.isEditMode && this.jobId) {
        const updatedJob: Job = {
          ...this.jobsService.getJob(this.jobId)!,
          ...formValue
        };
        this.jobsService.updateJob(updatedJob);
      } else {
        this.jobsService.addJob(formValue);
      }
      this.router.navigate(['/jobs']);
    }
  }
}
