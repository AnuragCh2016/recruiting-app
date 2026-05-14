import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApplicationDetailRead, ApplicationStatus } from '../../models';
import { Observable, of, map, switchMap, catchError, tap } from 'rxjs';
import { ApplicationService } from '../../services/application.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.css'],
})
export class ApplicationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private applicationService = inject(ApplicationService);

  application$: Observable<ApplicationDetailRead | undefined>;
  fetchError: boolean = false;
  isEditMode = false;
  selectedStatus: ApplicationStatus = ApplicationStatus.Sourced;
  comments: string = '';

  applicationStatuses = Object.values(ApplicationStatus);

  constructor() {
    const applicationId$ = this.route.paramMap.pipe(
      map((params) => Number(params.get('id'))),
    );

    this.application$ = applicationId$.pipe(
      switchMap((id) =>
        this.applicationService.getApplicationById(id).pipe(
          tap((data) => {
            this.selectedStatus = data.status;
            this.comments = data.comments || '';
          }),
          map((data) => data),
          catchError((err) => {
            this.fetchError = true;
            return of(undefined);
          }),
        ),
      ),
    );
  }

  ngOnInit(): void {}

  toggleEdit() {
    this.isEditMode = !this.isEditMode;
  }

  saveChanges() {
    if (this.application$) {
      this.application$.subscribe((app) => {
        if (app) {
          const updates = {
            status: this.selectedStatus,
            comments: this.comments,
          };

          this.applicationService.updateApplication(app.id, updates).subscribe({
            next: () => {
              this.isEditMode = false;
              // Refresh the data
              this.application$ = this.applicationService.getApplicationById(
                app.id,
              );
            },
            error: (err) => {
              console.error('Update failed', err);
              alert('Failed to update application. Please try again.');
            },
          });
        }
      });
    }
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

  get applicationId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  reloadPage() {
    location.reload();
  }
}
