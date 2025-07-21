import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { RoutePermissionMap } from '../../permission-map';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Blacklist enforcement: block navigation if blacklisted
    if (localStorage.getItem('blacklisted') === 'true') {
      // Check with backend if user is still blacklisted
      this.auth.checkBlacklistStatus().subscribe({
        next: (response) => {
          // If user is no longer blacklisted, clear the flags
          if (!response.blacklisted) {
            this.auth.clearBlacklistFlags();
          }
        },
        error: (error) => {
          // If API call fails, keep the current blacklist status
          console.error('Failed to check blacklist status:', error);
        }
      });

      return this.router.createUrlTree(['/blacklist-blocked'], { queryParams: {
        reason: localStorage.getItem('blacklistReason') || '',
        expiryDate: localStorage.getItem('blacklistExpiryDate') || ''
      }});
    }

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }
  
    // ✅ Get permission from route data (not path map)
    const requiredPermission = route.data['permission'];
  
    if (requiredPermission) {
      const userPermissions = this.auth.getPermissions();
      const hasPermission = userPermissions.includes(requiredPermission);
      if (!hasPermission) {
        // Get user roles (assume getRoles returns array of roles)
        const roles = this.auth.getRoles();
        const isCustomer = roles.map(r => r.toLowerCase()).includes('customer');
        if (!isCustomer) {
          // Show SweetAlert for non-customers
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Access Denied',
            text: 'You do not have permission to access this page.',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            customClass: {
              popup: 'swal2-toast'
            }
          });
          setTimeout(() => {
            window.history.back();
          }, 2000);
        } else {
          // For customers, just go back
          window.history.back();
        }
        return false;
      }
    }
  
    return true;
  }
  
  
}
