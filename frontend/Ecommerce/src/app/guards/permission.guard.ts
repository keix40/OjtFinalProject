import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(
    private perms: PermissionService,
    private router: Router,
    private location: Location,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const required = route.data['permission'] as string;
    if (!required || this.perms.hasPermission(required)) {
      return true;
    }

    const roles = this.authService.getRoles();
    // If the user is just a customer, silently go back
    if (roles.includes('CUSTOMER')) {
      this.location.back();
      return false;
    }

    // Show sweet alert then go back
    Swal.fire({
      icon: 'warning',
      title: 'Unauthorized',
      text: "You don't have permission to access this page.",
      confirmButtonText: 'OK'
    }).then(() => {
      this.location.back();
    });
    return false;
  }
} 