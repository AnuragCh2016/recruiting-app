import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserRead, UserRole, APIResponse } from '../models';

export interface UserCreatePayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  managerId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  /**
   * GET ALL USERS
   * Retrieves list of all users (Admin/Manager only)
   */
  getAllUsers(): Observable<UserRead[]> {
    return this.http.get<UserRead[]>(`${this.apiUrl}/all`);
  }

  /**
   * CREATE USER
   * Creates a new user (Admin/Manager only)
   */
  createUser(payload: UserCreatePayload): Observable<APIResponse> {
    return this.http.post<APIResponse>(this.apiUrl, payload);
  }

  /**
   * DEACTIVATE USER
   * Makes a user inactive (Admin only)
   */
  deactivateUser(userId: number): Observable<APIResponse> {
    return this.http.patch<APIResponse>(
      `${this.apiUrl}/${userId}/deactivate`,
      {},
    );
  }

  /**
   * CHANGE USER ROLE
   * Promotes or demotes a user (Admin only)
   */
  changeUserRole(userId: number, newRole: UserRole): Observable<APIResponse> {
    const params = new HttpParams().set('new_role', newRole);
    return this.http.patch<APIResponse>(
      `${this.apiUrl}/${userId}/change-role`,
      {},
      { params },
    );
  }

  /**
   * ASSIGN MANAGER
   * Assigns a manager to a user (Admin/Manager only)
   * Backend: PATCH /user/{user_id}/assign-manager?manager_id={managerId}
   */
  assignManager(userId: number, managerId: number): Observable<any> {
    const params = new HttpParams().set('manager_id', managerId.toString());
    return this.http.patch(
      `${this.apiUrl}/${userId}/assign-manager`,
      {},
      { params },
    );
  }

  /**
   * GET CURRENT USER
   * Retrieves the currently logged-in user's details
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }
}
