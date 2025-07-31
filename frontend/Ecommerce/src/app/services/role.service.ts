import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private http: HttpClient) {}

  getAllRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/roles`);
  }

  createRole(role: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/roles`, role);
  }

  updateRole(id: number, role: any): Observable<any> {
    return this.http.put<any>(`${API_URL}/roles/${id}`, role);
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete<any>(`${API_URL}/roles/${id}`);
  }

  assignPermissionsToRole(roleId: number, permissionIds: number[]): Observable<void> {
    return this.http.post<void>(`${API_URL}/role-permissions/assign?roleId=${roleId}`, permissionIds);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/auth/user/all`);
  }
  

  assignRoleToUser(userId: number, roleId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    return this.http.put(`${API_URL}/auth/user/${userId}/assign-role?roleId=${roleId}`, {}, {
      headers: headers,
      responseType: 'text'
    });
  }
  
}

