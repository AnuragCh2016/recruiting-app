import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
// Import the new Flat List interface
import {
  Application,
  ApplicationStatus,
  ApplicationSummary,
  ApplicationDetailRead,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private apiUrl = `${environment.apiUrl}/applications`;
  private resumeUrl = `${environment.apiUrl}/resumes`;

  // 1. Updated to use the ListRead interface for the UI stream
  private applicationsSubject = new BehaviorSubject<ApplicationSummary[]>([]);
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
  getApplications(): Observable<ApplicationSummary[]> {
    return this.http.get<ApplicationSummary[]>(this.apiUrl);
  }

  /**
   * GET APPLICATIONS FOR A SPECIFIC CANDIDATE
   */
  getApplicationsByCandidate(candidateId: number): Observable<ApplicationSummary[]> {
    return this.http.get<ApplicationSummary[]>(`${this.apiUrl}/candidate/${candidateId}`);
  }

  /**
   * GET FULL DETAILS (Everything including Job/Candidate objects)
   */
  getApplicationById(id: number): Observable<ApplicationDetailRead> {
    return this.http.get<ApplicationDetailRead>(`${this.apiUrl}/${id}`);
  }

  /**
   * CREATE APPLICATION (for existing candidate)
   */
  createApplication(data: {
    candidateId: number;
    jobId: number;
    totalExperience?: number;
    relevantExperience?: number;
    currentCtc?: number;
    expectedCtc?: number;
    noticePeriod?: string;
    comments?: string;
    status: ApplicationStatus;
  }): Observable<Application> {
    return this.http
      .post<Application>(`${this.apiUrl}/apply`, data)
      .pipe(tap(() => this.refreshApplications()));
  }

  /**
   * CREATE ATOMIC (Candidate + Application)
   */
  submitApplicationWithCandidate(data: any): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/apply`, data)
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
  getRecentApplications(limit = 5): Observable<ApplicationSummary[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<ApplicationSummary[]>(`${this.apiUrl}/recent`, {
      params,
    });
  }

  /**
   * Sends the resume to Gemini to extract core fields
   * and job-specific dynamic tracker fields.
   */
  parseResume(file: File, jobId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_id', jobId.toString());
    // jobId is passed as a query parameter to match our FastAPI signature

    return this.http.post<any>(`${this.resumeUrl}/parse`, formData);
  }

  /**
   * Uploads the actual binary to S3 and associates it
   * with the created Application ID.
   */
  uploadResume(applicationId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    // This matches the logic: Create Application -> Get ID -> Upload File
    return this.http.post<any>(
      `${this.apiUrl}/${applicationId}/upload-resume`,
      formData,
    );
  }
}
