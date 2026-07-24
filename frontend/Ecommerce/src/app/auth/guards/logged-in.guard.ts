import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Injectable({ providedIn: 'root' })
export class LoggedInGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) {
      const decoded = this.auth.getDecodedToken();
      let userRole = (decoded?.roles || decoded?.role || decoded?.roleName || '').toUpperCase();
      
      // Remove ROLE_ prefix if present
      if (userRole.startsWith('ROLE_')) {
        userRole = userRole.replace('ROLE_', '');
      }
      
      // Redirect based on role (centralized)
      this.router.navigate([this.auth.redirectPathForRoles(userRole)]);
      return false;
    }
    return true;
  }
} 