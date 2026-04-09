import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApplicationService } from '../../services/application.service';
import { ApplicationListRead } from '../../models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-candidate-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.css'],
})
export class CandidateListComponent implements OnInit {
  private applicationService = inject(ApplicationService);
  candidates$: Observable<ApplicationListRead[]>;

  constructor() {
    this.candidates$ = this.applicationService.applications$;
    this.applicationService.refreshApplications();
  }

  ngOnInit(): void {}
}
