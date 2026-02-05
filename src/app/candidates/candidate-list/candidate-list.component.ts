import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CandidatesService } from '../../services/candidates.service';
import { Candidate } from '../../models';
import { JobsService } from '../../services/jobs.service';
import { Observable, combineLatest, map } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-candidate-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.css']
})
export class CandidateListComponent implements OnInit {
  private candidatesService = inject(CandidatesService);
  private jobsService = inject(JobsService);

  private route = inject(ActivatedRoute);

  candidates$: Observable<any[]>;
  statusFilter: string = 'All';
  
  statuses = ['All', 'Sourced', 'Shortlisted', 'In Process', 'Hired', 'Rejected', 'On Hold'];

  constructor() {
    this.candidates$ = combineLatest([
      this.candidatesService.getAllCandidates(),
      this.jobsService.jobs$
    ]).pipe(
      map(([candidates, jobs]) => {
        return candidates.map(c => ({
          ...c,
          jobTitle: jobs.find(j => j.id === c.jobId)?.title || 'Unknown Job'
        }));
      })
    );
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
        if (params['status']) {
            this.statusFilter = params['status'];
        }
    });
  }
  
  getFilteredCandidates(candidates: any[] | null): any[] {
    if (!candidates) return [];
    if (this.statusFilter === 'All') return candidates;
    return candidates.filter(c => c.status === this.statusFilter);
  }

  editingCandidateId: number | null = null;
  // Temporary storage for status change during edit
  tempStatus: string = '';

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
}
