import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PermissionConstants } from '../constants/permission.constants';
import { map } from 'rxjs/operators';

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

  // NEW: Method to refresh user permissions from backend
  refreshPermissions(): Observable<string[]> {
    // Get all users and find the current user to get updated role information
    return this.http.get<any[]>(`${API_URL}/auth/user/all`).pipe(
      map((users: any[]) => {
        // Get current user ID from JWT token
        const token = localStorage.getItem('token');
        if (!token) return [];
        
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentUserId = payload.id;
          
          // Find current user in the list
          const currentUser = users.find(u => u.id === currentUserId);
          if (currentUser && currentUser.role && currentUser.role.permissions) {
            return currentUser.role.permissions.map((perm: any) => 
              typeof perm === 'string' ? perm : perm.key || perm.name
            );
          }
        } catch (error) {
          console.error('Error parsing JWT token:', error);
        }
        return [];
      })
    );
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
