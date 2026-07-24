import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { Location } from '@angular/common';
import { AuthService } from '../auth/auth.service';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(
    private perms: PermissionService,
    private router: Router,
    private location: Location,
    private authService: AuthService,
    private luxDialog: LuxDialogService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const required = route.data['permission'] as string;
    if (!required || this.perms.hasPermission(required)) {
      return true;
    }

    const roles = this.authService.getRoles();
    if (roles.includes('CUSTOMER')) {
      this.location.back();
      return false;
    }

    this.luxDialog
      .warning('Unauthorized', "You don't have permission to access this page.")
      .then(() => this.location.back());
    return false;
  }
}
