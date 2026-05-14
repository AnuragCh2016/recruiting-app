import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobsService } from '../../services/jobs.service';
import { JobReadWithCount } from '../../models';
import { Observable, catchError, of } from 'rxjs';

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.css'],
})
export class JobsListComponent implements OnInit {
  private jobsService = inject(JobsService);
  jobs$: Observable<JobReadWithCount[]>;
  fetchError: boolean = false;

  constructor() {
    this.jobs$ = this.jobsService.refreshJobs().pipe(
      catchError((err) => {
        this.fetchError = true;
        console.error('Error fetching jobs:', err);
        return of([]);
      }),
    );
  }

  ngOnInit(): void {}

  reloadPage() {
    window.location.reload();
  }
}
