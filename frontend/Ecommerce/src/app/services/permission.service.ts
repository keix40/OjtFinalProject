import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PermissionConstants } from '../constants/permission.constants';

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

  hasPermission(permissionKey: string): boolean {
    return this.userPermissions.includes(permissionKey);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  getPermissions(): string[] {
    return this.userPermissions;
  }
}
