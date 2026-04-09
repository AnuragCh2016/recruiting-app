import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
// Import the new Flat List interface
import { Application, ApplicationStatus, ApplicationListRead } from '../models';

export interface ApplicationWithCandidateCreate {
  fullName: string; // Changed to camelCase
  email: string;
  phone: string;
  jobId: number; // Changed to camelCase
  totalExperience: number;
  relevantExperience: number;
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  currentLocation: string;
  resumeUrl: string;
  dynamicData: Record<string, any>;
  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private apiUrl = `${environment.apiUrl}/applications`;

  // 1. Updated to use the ListRead interface for the UI stream
  private applicationsSubject = new BehaviorSubject<ApplicationListRead[]>([]);
  public applications$ = this.applicationsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Removed refreshApplications from constructor to avoid loading before auth
  }

  /**
   * Updates the global stream. Components using async pipe or
   * subscribing to applications$ will update automatically.
   */
  refreshApplications(): void {
    this.getApplications().subscribe({
      next: (apps) => this.applicationsSubject.next(apps),
      error: (err) => console.error('Failed to load applications', err),
    });
  }

  /**
   * GET ALL APPLICATIONS (Flattened & RBAC Filtered)
   */
  getApplications(): Observable<ApplicationListRead[]> {
    return this.http.get<ApplicationListRead[]>(this.apiUrl);
  }

  /**
   * GET FULL DETAILS (Everything including Job/Candidate objects)
   */
  getApplicationById(id: number): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/${id}`);
  }

  /**
   * CREATE ATOMIC (Candidate + Application)
   */
  submitApplicationWithCandidate(
    data: ApplicationWithCandidateCreate,
  ): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/create`, data)
      .pipe(tap(() => this.refreshApplications()));
  }

  /**
   * UPDATE APPLICATION
   */
  updateApplication(
    id: number,
    updates: Partial<Application>,
  ): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/${id}`, updates)
      .pipe(tap(() => this.refreshApplications()));
  }

  /**
   * QUICK STATUS UPDATE
   */
  updateStatus(id: number, status: ApplicationStatus): Observable<any> {
    return this.updateApplication(id, { status });
  }

  /**
   * RECENT APPLICATIONS (Dashboard View)
   */
  getRecentApplications(limit = 5): Observable<ApplicationListRead[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<ApplicationListRead[]>(`${this.apiUrl}/recent`, {
      params,
    });
  }
}
