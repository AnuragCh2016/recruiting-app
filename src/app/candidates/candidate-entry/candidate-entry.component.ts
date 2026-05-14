import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApplicationService } from '../../services/application.service';
import { ResumeService } from '../../services/resume.service';

@Component({
  selector: 'app-candidate-entry',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './candidate-entry.component.html',
  styleUrl: './candidate-entry.component.css',
})
export class CandidateEntryComponent {
  isParsing = false;
  private readonly applicationService = inject(ApplicationService);
  private readonly resumeService = inject(ResumeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  jobId: number | null = null;

  ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('jobId');
    this.jobId = id ? +id : null;
  }

  // CHOICE A: Manual Entry
  goToManualEntry() {
    this.resumeService.clearData(); // Ensure no old AI data is lingering
    this.router.navigate(['/add-candidate'], {
      queryParams: { jobId: this.jobId },
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0] as File;
    if (!file) return;

    const jobId = this.route.snapshot.queryParamMap.get('jobId');

    if (!jobId) {
      alert('No Job ID found. Please go back and select a job.');
      return;
    }

    this.isParsing = true;
    this.applicationService.parseResume(file, +jobId).subscribe({
      next: (data: any) => {
        // 1. Store the parsed JSON data
        this.resumeService.setParsedData(data);
        // 2. Store the binary File object so it can be uploaded later
        this.resumeService.setResumeFile(file);

        this.router.navigate(['/add-candidate'], {
          queryParams: { jobId: jobId },
        });
      },
      error: (err: any) => {
        this.isParsing = false;
        console.error(err);
        alert('Parsing failed. Please try manual entry.');
      },
    });
  }
}
