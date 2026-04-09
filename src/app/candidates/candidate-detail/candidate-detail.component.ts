import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, switchMap, map } from 'rxjs';

import { ApplicationService } from '../../services/application.service';
import { Application, ApplicationStatus } from '../../models';

@Component({
  selector: 'app-candidate-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './candidate-detail.component.html',
  styleUrls: ['./candidate-detail.component.css'],
})
export class CandidateDetailComponent implements OnInit {
  protected readonly Object = Object;
  private route = inject(ActivatedRoute);
  private applicationService = inject(ApplicationService);

  candidate$: Observable<Application | undefined>;

  readonly statuses: ApplicationStatus[] = [
    ApplicationStatus.Sourced,
    ApplicationStatus.Shared,
    ApplicationStatus.InProcess,
    ApplicationStatus.OfferReleased,
    ApplicationStatus.Rejected,
    ApplicationStatus.Joined,
  ];

  editingStatus = false;
  tempStatus: ApplicationStatus | '' = '';

  constructor() {
    const candidateId$ = this.route.paramMap.pipe(
      map((params) => Number(params.get('id'))),
    );

    this.candidate$ = candidateId$.pipe(
      switchMap((id) => this.applicationService.getApplicationById(id)),
    );
  }

  ngOnInit(): void {}

  startEditingStatus(currentStatus: ApplicationStatus) {
    this.editingStatus = true;
    this.tempStatus = currentStatus;
  }

  cancelEditingStatus() {
    this.editingStatus = false;
    this.tempStatus = '';
  }

  saveStatus(candidate: Application) {
    if (!this.tempStatus || this.tempStatus === candidate.status) {
      this.cancelEditingStatus();
      return;
    }

    if (
      confirm(
        `Change status to "${this.tempStatus}" for ${candidate.candidate?.fullName}?`,
      )
    ) {
      this.applicationService
        .updateStatus(candidate.id, this.tempStatus as ApplicationStatus)
        .subscribe({
          next: () => {
            this.cancelEditingStatus();
            // Refresh the candidate data
            this.refreshCandidateData();
          },
          error: (err) => console.error('Status update failed', err),
        });
    } else {
      this.cancelEditingStatus();
    }
  }

  private refreshCandidateData() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.candidate$ = this.applicationService.getApplicationById(id);
  }

  public objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  /**
   * Helper to find specific contact values from the Application model
   * to avoid logic in the HTML template.
   */
  getContactValue(
    candidate: Application | undefined | null,
    type: 'phone' | 'email',
  ): string {
    if (!candidate?.candidate?.contacts) return 'N/A';

    const contact = candidate.candidate.contacts.find(
      (c: any) => c.type.toLowerCase() === type,
    );

    return contact ? contact.value : 'N/A';
  }
}
