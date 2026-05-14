import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApplicationSummary } from '../../models';
import { Observable, catchError, of } from 'rxjs';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.css'],
})
export class ApplicationListComponent implements OnInit {
  private applicationService = inject(ApplicationService);
  applications$: Observable<ApplicationSummary[]>;
  fetchError: boolean = false;

  constructor() {
    this.applications$ = this.applicationService.getApplications().pipe(
      catchError((err) => {
        this.fetchError = true;
        console.error('Error fetching applications:', err);
        return of([]);
      }),
    );
  }

  ngOnInit(): void {}

  reloadPage() {
    window.location.reload();
  }

  getStatusColorClass(status: string): string {
    const statusColors: { [key: string]: string } = {
      Sourced: 'bg-blue-100 text-blue-800',
      Shared: 'bg-yellow-100 text-yellow-800',
      'In Process': 'bg-purple-100 text-purple-800',
      'Offer Released': 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Joined: 'bg-emerald-100 text-emerald-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }
}
