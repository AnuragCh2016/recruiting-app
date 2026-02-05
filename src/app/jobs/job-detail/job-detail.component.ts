import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { JobsService } from '../../services/jobs.service';
import { CandidatesService } from '../../services/candidates.service';
import { Job, Candidate } from '../../models';
import { Observable, switchMap, map } from 'rxjs';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css']
})
export class JobDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobsService = inject(JobsService);
  private candidatesService = inject(CandidatesService);

  job$: Observable<Job | undefined>;
  candidates$: Observable<Candidate[]>;

  constructor() {
    this.job$ = this.route.paramMap.pipe(
      map(params => {
        const id = Number(params.get('id')); // Extract 'id' properly
        return this.jobsService.getJob(id);
      })
    );

    this.candidates$ = this.route.paramMap.pipe(
      switchMap(params => {
         const id = Number(params.get('id'));
         return this.candidatesService.getCandidates(id);
      })
    );
  }

  ngOnInit(): void {
  }
  updateStatus(job: Job, newStatus: string) {
      if (job.status !== newStatus) {
          const updatedJob = { ...job, status: newStatus as any }; // Cast to any or JobStatus type
          this.jobsService.updateJob(updatedJob);
      }
  }

  editingCandidateId: number | null = null;
  tempStatus: string = '';
  statuses = ['Sourced', 'Shortlisted', 'In Process', 'Hired', 'Rejected', 'On Hold'];

  startEditing(candidate: Candidate) {
    this.editingCandidateId = candidate.id;
    this.tempStatus = candidate.status;
  }

  cancelEditing() {
    this.editingCandidateId = null;
    this.tempStatus = '';
  }

  saveStatus(candidate: Candidate) {
      if (this.tempStatus === candidate.status) {
          this.cancelEditing();
          return;
      }

      if (confirm(`Are you sure you want to change the status to "${this.tempStatus}"?`)) {
          const updatedCandidate = { ...candidate, status: this.tempStatus as any };
          
          if (this.tempStatus === 'Rejected') {
              updatedCandidate.rejectedOn = new Date();
          } else {
              delete updatedCandidate.rejectedOn;
          }

          this.candidatesService.updateCandidate(updatedCandidate);
      }
      this.cancelEditing();
  }

  exportToExcel() {
    // We need both job and candidates. job$ and candidates$ are observables.
    // We can use withLatestFrom or combineLatest, or just subscribe to candidates since we likely don't need job details in the excel strictly, or just filename.
    
    // Combining both to get job code for filename
    import('xlsx').then(XLSX => {
      // Using RxJS to get values
      const combined = this.candidates$.pipe(
          switchMap(candidates => this.job$.pipe(map(job => ({ candidates, job }))))
      );

      combined.subscribe({
          next: ({ candidates, job }) => {
              if (!candidates || candidates.length === 0) {
                  alert('No candidates to export.');
                  return;
              }
              
              // Map to a cleaner format if needed, or export raw
              const dataToExport = candidates.map(c => ({
                  'Name': c.fullName,
                  'Email': c.email,
                  'Phone': c.phone,
                  'Status': c.status,
                  'Total Exp': c.totalExperience,
                  'Current CTC': c.currentCtc,
                  'Expected CTC': c.expectedCtc,
                  'Notice Period': c.noticePeriod,
                  'Location': c.location,
                  'Notes': c.notes || ''
              }));

              const ws = XLSX.utils.json_to_sheet(dataToExport);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
              
              const filename = `candidates_${job?.jobCode || 'job'}.xlsx`;
              XLSX.writeFile(wb, filename);
          },
          error: (err) => console.error('Export failed', err)
      }).unsubscribe(); // Check if unsubscribe is needed or take(1)
    });
  }
}
