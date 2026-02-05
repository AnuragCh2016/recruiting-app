import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobsService } from '../../services/jobs.service';
import { Job } from '../../models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.css']
})
export class JobsListComponent implements OnInit {
  private jobsService = inject(JobsService);
  jobs$: Observable<Job[]>;

  constructor() {
    this.jobs$ = this.jobsService.jobs$;
  }

  ngOnInit(): void {
  }
}
