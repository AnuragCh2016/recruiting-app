import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobsService } from '../services/jobs.service';
import { CandidatesService } from '../services/candidates.service';
import { Job, Candidate } from '../models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
  private router = inject(Router);
  private jobsService = inject(JobsService);
  private candidatesService = inject(CandidatesService);

  searchQuery = '';
  searchResults: any[] = [];
  showResults = false;

  constructor() {}

  async onSearch() {
    if (!this.searchQuery.trim()) {
      this.showResults = false;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    
    // Simple client-side search
    const jobs = await firstValueFrom(this.jobsService.jobs$) as Job[];
    const candidates = await firstValueFrom(this.candidatesService.candidates$) as Candidate[];

    const matchingJobs = jobs.filter((j: Job) => 
      j.title.toLowerCase().includes(query) || 
      j.jobCode.toLowerCase().includes(query)
    ).map((j: Job) => ({ type: 'Job', name: j.title, id: j.id, detail: j.jobCode }));

    const matchingCandidates = candidates.filter((c: Candidate) => 
      c.fullName.toLowerCase().includes(query) || 
      c.email.toLowerCase().includes(query)
    ).map((c: Candidate) => ({ type: 'Candidate', name: c.fullName, id: c.jobId, detail: c.email })); // Navigating to Job for now as per req, or should it be candidate detail? Req says "Associated job if candidate is found". Wait, "Auto-redirect to Job detail page / Associated job if candidate is found".

    // For candidate, let's navigate to the job detail but maybe expanded? 
    // Actually, MVP req says "Associated job if candidate is found". 
    // But we have candidate list too. Let's redirect to Job Detail for now as that's where candidates are listed mainly.
    // Or maybe Candidate List filtered? "View list of candidates" is a feature.
    // Let's stick to simple "Go to Job" for MVP if it's a job match, or "Go to Candidate list filtered" if it's a candidate?
    // Req: "Auto-redirect to: Job detail page, Associated job if candidate is found"
    
    this.searchResults = [...matchingJobs, ...matchingCandidates];
    this.showResults = true;
  }

  selectResult(result: any) {
    this.showResults = false;
    this.searchQuery = '';
    if (result.type === 'Job') {
      this.router.navigate(['/jobs', result.id]);
    } else if (result.type === 'Candidate') {
      // Redirect to the job since the candidate is associated with it
      this.router.navigate(['/jobs', result.id]); 
    }
  }

  closeSearch() {
    setTimeout(() => {
      this.showResults = false;
    }, 200);
  }
}
