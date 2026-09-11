import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const API_URL = '/api';
const httpOptions = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private http: HttpClient) {}

  getAllRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/roles`, httpOptions);
  }

  createRole(role: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/roles`, role, httpOptions);
  }

  updateRole(id: number, role: any): Observable<any> {
    return this.http.put<any>(`${API_URL}/roles/${id}`, role, httpOptions);
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete<any>(`${API_URL}/roles/${id}`, httpOptions);
  }

  assignPermissionsToRole(roleId: number, permissionIds: number[]): Observable<void> {
    return this.http.post<void>(`${API_URL}/role-permissions/assign?roleId=${roleId}`, permissionIds, httpOptions);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/auth/user/all`, httpOptions);
  }

  assignRoleToUser(userId: number, roleId: number): Observable<any> {
    return this.http.put(`${API_URL}/auth/user/${userId}/assign-role?roleId=${roleId}`, {}, {
      ...httpOptions,
      responseType: 'text'
    });
  }
}
