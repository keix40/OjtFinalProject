import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { RoutePermissionMap } from '../../permission-map';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
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
