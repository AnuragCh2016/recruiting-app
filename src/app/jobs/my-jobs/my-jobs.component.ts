import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';
import { JobReadWithCount } from '../../models';
import { JobsService } from '../../services/jobs.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-jobs.component.html',
  styleUrls: ['./my-jobs.component.css'],
})
export class MyJobsComponent implements OnInit {
  private jobsService = inject(JobsService);
  private authService = inject(AuthService);

  jobs$!: Observable<JobReadWithCount[]>;
  fetchError: boolean = false;
  currentUser: any = null;

  constructor() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnInit(): void {
    this.loadMyJobs();
  }

  loadMyJobs(): void {
    this.jobs$ = this.jobsService.refreshJobs().pipe(
      tap(() => (this.fetchError = false)),
      catchError((err) => {
        this.fetchError = true;
        console.error('Error fetching jobs:', err);
        return of([]);
      }),
    );
  }

  reloadPage() {
    window.location.reload();
  }
}
