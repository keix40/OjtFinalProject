import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private userPermissions: string[] = [];
  constructor(private http: HttpClient) {
    this.loadPermissionsFromStorage();
  }

  getAllPermissions(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/permissions`);
  }

  setPermissions(perms: string[]) {
    this.userPermissions = perms;
    localStorage.setItem('userPermissions', JSON.stringify(this.userPermissions));
  }

  loadPermissionsFromStorage() {
    const perms = localStorage.getItem('userPermissions');
    this.userPermissions = perms ? JSON.parse(perms) : [];
  }

  // ✅ Check from current user permissions
  hasPermission(permissionKey: string): boolean {
    return this.userPermissions.includes(permissionKey);
  }

  // ✅ Optional: Get user permission list (for debug or UI loop)
  getPermissions(): string[] {
    return this.userPermissions;
  }
}
