import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  APIResponse,
  Job,
  JobReadWithApplications,
  JobReadWithCount,
} from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class JobsService {
  private http = inject(HttpClient); // Modern Angular inject pattern
  private readonly apiBaseUrl = `${environment.apiUrl}/jobs`;

  // We keep the BehaviorSubject to act as a local cache
  private jobsSubject = new BehaviorSubject<Job[]>([]);
  jobs$ = this.jobsSubject.asObservable();

  constructor() {
    // Removed loadJobsIntoCache from constructor to avoid loading before auth
  }

  /**
   * GET all jobs and update the local stream
   */
  refreshJobs(): Observable<JobReadWithCount[]> {
    return this.http
      .get<JobReadWithCount[]>(this.apiBaseUrl)
      .pipe(tap((jobs) => this.jobsSubject.next(jobs as unknown as Job[])));
  }

  /**
   * GET a single job by ID from the API
   */
  getJob(id: number): Observable<JobReadWithApplications> {
    return this.http.get<JobReadWithApplications>(`${this.apiBaseUrl}/${id}`);
  }

  /**
   * POST a new job to FastAPI
   */
  addJob(job: Partial<Job>): Observable<APIResponse> {
    return this.http.post<APIResponse>(this.apiBaseUrl, job).pipe(
      tap(() => this.loadJobsIntoCache()), // Automatically refresh the list after adding
    );
  }

  /**
   * PUT (Update) an existing job
   */
  updateJob(updatedJob: Job): Observable<Job> {
    return this.http
      .put<Job>(`${this.apiBaseUrl}/${updatedJob.id}`, updatedJob)
      .pipe(
        tap(() => this.loadJobsIntoCache()), // Refresh list to show updated data
      );
  }

  /**
   * PATCH a specific field (like candidate count)
   */
  updateCandidateCount(jobId: number, count: number): Observable<Job> {
    // Assuming your FastAPI has a /jobs/{id}/candidate-count endpoint
    return this.http
      .patch<Job>(`${this.apiBaseUrl}/${jobId}/candidate-count`, { count })
      .pipe(tap(() => this.loadJobsIntoCache()));
  }

  private loadJobsIntoCache(): void {
    this.refreshJobs().subscribe({
      error: (err) => console.error('Failed to load jobs', err),
    });
  }

  get currentJobsValue(): Job[] {
    return this.jobsSubject.value;
  }

  /**
   * Uploads a JD file for a specific job ID
   * Matches FastAPI: @router.post("/upload-jd/{job_id}")
   */
  uploadJd(jobId: number, file: File): Observable<APIResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<APIResponse>(
      `${this.apiBaseUrl}/upload-jd/${jobId}`,
      formData,
    );
  }
}
