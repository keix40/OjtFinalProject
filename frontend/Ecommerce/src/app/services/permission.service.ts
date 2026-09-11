import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SessionUser } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private userPermissions: string[] = [];

  constructor(private http: HttpClient) {}

  getAllPermissions(): Observable<any[]> {
    return this.http.get<any[]>('/api/permissions', { withCredentials: true });
  }

  refreshPermissions(): Observable<string[]> {
    return this.http.get<SessionUser>('/api/auth/me', { withCredentials: true }).pipe(
      map(session => {
        const perms = session?.permissions
          ? session.permissions.split(',').map(p => p.trim()).filter(Boolean)
          : [];
        this.setPermissions(perms);
        return perms;
      })
    );
  }

  setPermissions(perms: string[]) {
    this.userPermissions = perms;
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
