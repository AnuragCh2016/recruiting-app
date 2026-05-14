import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserRead, Job, APIResponse } from '../models';

export interface JobAllocatePayload {
  jobId: number;
  userId: number;
  assignToTeam?: boolean;
}

export interface TeamAssignmentResponse {
  message: string;
  assigned_ids: number[];
}

@Injectable({
  providedIn: 'root',
})
export class JobAllocationService {
  private apiUrl = `${environment.apiUrl}/jobs`;
  private usersApiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  /**
   * GET ALL JOBS (for allocation dropdown)
   */
  getAllJobsForAllocation(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.apiUrl}/all`);
  }

  /**
   * GET ALL USERS (for allocation dropdown)
   */
  getAllUsersForAllocation(): Observable<UserRead[]> {
    return this.http.get<UserRead[]>(`${this.apiUrl}/users`);
  }

  /**
   * GET TL's TEAM MEMBERS
   * Returns all users reporting to a specific TL
   */
  getTlTeamMembers(tlId: number): Observable<UserRead[]> {
    return this.http.get<UserRead[]>(`${this.usersApiUrl}/${tlId}/team`);
  }

  /**
   * GET MANAGER's TEAMS
   * Returns all TLs and their team members reporting to a manager
   */
  getManagerTeams(managerId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/manager/${managerId}/teams`);
  }

  /**
   * ASSIGN JOB TO USER (Individual assignment)
   * Endpoint: POST /user/{job_id}/assign/{user_id}
   */
  assignJobToUser(jobId: number, userId: number): Observable<any> {
    return this.http.post(`${this.usersApiUrl}/${jobId}/assign/${userId}`, {});
  }

  /**
   * ASSIGN JOB TO TEAM (TL + all subordinates recursively)
   * Endpoint: POST /user/jobs/{job_id}/assign-team/{target_user_id}
   */
  assignJobToTeam(
    jobId: number,
    targetUserId: number,
  ): Observable<TeamAssignmentResponse> {
    return this.http.post<TeamAssignmentResponse>(
      `${this.usersApiUrl}/jobs/${jobId}/assign-team/${targetUserId}`,
      {},
    );
  }

  /**
   * GET ASSIGNED USERS FOR A JOB
   */
  getJobAssignments(jobId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${jobId}/assignments`);
  }

  /**
   * REMOVE JOB ASSIGNMENT
   */
  removeJobAssignment(jobId: number, userId: number): Observable<APIResponse> {
    return this.http.delete<APIResponse>(
      `${this.apiUrl}/${jobId}/assignments/${userId}`,
    );
  }
}
