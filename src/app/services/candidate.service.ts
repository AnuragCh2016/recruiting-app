import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';
// Import the Candidate interface
import { Candidate, CandidateDetailsRead, CandidateListRead } from '../models';

@Injectable({
  providedIn: 'root',
})

// todo: add and use proper schemas -- creating candidate, getting 1 candidate. only one correct is getAll
export class CandidateService {
  private apiUrl = `${environment.apiUrl}/candidates`;

  // BehaviorSubject for candidates list
  private candidatesSubject = new BehaviorSubject<CandidateListRead[]>([]);
  public candidates$ = this.candidatesSubject.asObservable();

  constructor(private http: HttpClient) {
    // Removed refreshCandidates from constructor to avoid loading before auth
  }

  /**
   * Updates the global stream. Components using async pipe or
   * subscribing to candidates$ will update automatically.
   */
  refreshCandidates(): void {
    this.getCandidates().subscribe({
      next: (candidates) => this.candidatesSubject.next(candidates),
      error: (err) => console.error('Failed to load candidates', err),
    });
  }

  /**
   * GET ALL CANDIDATES
   */
  getCandidates(): Observable<CandidateListRead[]> {
    return this.http.get<CandidateListRead[]>(this.apiUrl);
  }

  /**
   * GET FULL DETAILS
   */
  getCandidateById(id: number): Observable<CandidateDetailsRead> {
    return this.http.get<CandidateDetailsRead>(`${this.apiUrl}/${id}`);
  }

  /**
   * CREATE CANDIDATE
   * Note: Accepts any object matching backend's CandidateCreate schema
   */
  createCandidate(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, data);
  }

  /**
   * UPLOAD RESUME FOR CANDIDATE
   */
  uploadResume(candidateId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.apiUrl}/${candidateId}/upload-resume`,
      formData,
    );
  }

  /**
   * UPDATE CANDIDATE
   */
  updateCandidate(
    id: number,
    updates: Partial<Candidate> | FormData,
  ): Observable<Candidate> {
    const headers = updates instanceof FormData ? {} : undefined;
    return this.http
      .patch<Candidate>(`${this.apiUrl}/${id}`, updates, { headers })
      .pipe(tap(() => this.refreshCandidates()));
  }

  /**
   * DELETE CANDIDATE
   */
  deleteCandidate(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.refreshCandidates()));
  }

  /**
   * RECENT CANDIDATES (Dashboard View)
   */
  getRecentCandidates(limit = 5): Observable<Candidate[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<Candidate[]>(`${this.apiUrl}/recent`, {
      params,
    });
  }

  /**
   * SEARCH CANDIDATES
   */
  searchCandidates(criteria: any): Observable<CandidateDetailsRead[]> {
    return this.http
      .post<any>(`${this.apiUrl}/search`, criteria)
      .pipe(map((response) => response.data || []));
  }
}
