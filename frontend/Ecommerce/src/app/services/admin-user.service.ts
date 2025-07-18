import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: { name: string } | { id: number; name: string } | string;
  department?: string;
  status: string;
  permissions: string[];
  lastLogin?: string | Date;
  // Add other fields as needed
}

export interface AdminUserDTO {
  name: string;
  email: string;
  password?: string;
  department?: string;
  roleName: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private apiUrl = 'http://localhost:8080/api/admin-users';
  constructor(private http: HttpClient) {}

  getAdminUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.apiUrl);
  }

  getAdminActivities(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/activities`);
  }

  createAdminUser(data: AdminUserDTO): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.apiUrl, data);
  }

  updateAdminUser(id: number, data: AdminUserDTO): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}/${id}`, data);
  }

  updateAdminStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteAdminUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getAdminUsersOnlineStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/online-status`);
  }

  logAdminActivity(userId: number, type: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/activity`, { userId, type });
  }
} 