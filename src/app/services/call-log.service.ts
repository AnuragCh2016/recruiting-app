import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CallLogCreate, CallLogRead, CallLogSummary } from '../models';

@Injectable({
  providedIn: 'root',
})
export class CallLogService {
  private apiUrl = `${environment.apiUrl}/call-logs`;

  constructor(private http: HttpClient) {}

  /**
   * CREATE CALL LOG
   * Creates a new call log entry
   */
  createCallLog(
    payload: CallLogCreate,
  ): Observable<{ status: string; message: string; data: { id: number } }> {
    return this.http.post<{
      status: string;
      message: string;
      data: { id: number };
    }>(this.apiUrl, payload);
  }

  /**
   * GET MY CALL LOGS
   * Retrieves call logs for the current user
   * Defaults to today's date if no dates provided
   */
  getMyCallLogs(
    startDate?: string,
    endDate?: string,
  ): Observable<CallLogRead[]> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }

    return this.http.get<CallLogRead[]>(`${this.apiUrl}/me`, { params });
  }

  /**
   * GET TEAM CALL LOGS
   * Retrieves call logs based on user role:
   * - Admin: All logs
   * - Manager/TL: Their team's logs (hierarchy-aware)
   * - Recruiter: Their own logs
   */
  getTeamCallLogs(
    startDate: string,
    endDate: string,
  ): Observable<CallLogRead[]> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);

    return this.http.get<CallLogRead[]>(`${this.apiUrl}/team-logs`, { params });
  }

  /**
   * GET CALL LOG SUMMARY
   * Retrieves aggregated call log statistics grouped by recruiter, date, and job
   */
  getCallLogSummary(
    startDate: string,
    endDate: string,
  ): Observable<CallLogSummary[]> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);

    return this.http.get<CallLogSummary[]>(`${this.apiUrl}/summary`, {
      params,
    });
  }

  /**
   * GET RECRUITER LOGS (Admin/Manager/TL only)
   * Retrieves call logs for a specific recruiter
   * Requires appropriate permissions (Admin, Manager, or TeamLead)
   */
  getRecruiterLogs(
    recruiterId: number,
    startDate: string,
    endDate: string,
  ): Observable<CallLogRead[]> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);

    return this.http.get<CallLogRead[]>(
      `${this.apiUrl}/recruiter/${recruiterId}`,
      { params },
    );
  }
}
