import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { RoutePermissionMap } from '../../permission-map';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    console.log('[AuthGuard] Checking route:', state.url);
    
    // First, check and clear expired blacklist flags
    this.auth.checkAndClearExpiredBlacklist();
    
    // Priority 1: Check localStorage first (for immediate response)
    if (localStorage.getItem('blacklisted') === 'true') {
      console.log('[AuthGuard] User is blacklisted in localStorage, redirecting to blacklist-blocked');
      return this.router.createUrlTree(['/blacklist-blocked'], { 
        queryParams: {
          reason: localStorage.getItem('blacklistReason') || '',
          expiryDate: localStorage.getItem('blacklistExpiryDate') || '',
          banType: localStorage.getItem('banType') || 'Temporary',
          isPermanent: localStorage.getItem('isPermanent') || 'false'
        }
      });
    }
    
    // Check if user is logged in
    const isLoggedIn = this.auth.isLoggedIn();
    console.log('[AuthGuard] isLoggedIn:', isLoggedIn);
    if (!isLoggedIn) {
      console.log('[AuthGuard] User not logged in, redirecting to login');
      return this.router.createUrlTree(['/login']);
    }
    
    // Priority 2: For logged-in users without localStorage flag, check with backend
    console.log('[AuthGuard] User is logged in, checking with backend...');
    return new Promise<boolean | UrlTree>((resolve) => {
      this.auth.checkBlacklistStatus().subscribe({
        next: (response) => {
          console.log('[AuthGuard] Backend response:', response);
          if (response.blacklisted) {
            console.log('[AuthGuard] User is blacklisted by backend, setting flags and redirecting');
            // User is blacklisted, set flags and redirect
            localStorage.setItem('blacklisted', 'true');
            localStorage.setItem('blacklistReason', response.reason || '');
            localStorage.setItem('blacklistExpiryDate', response.expiryDate || '');
            localStorage.setItem('banType', response.banType || 'Temporary');
            localStorage.setItem('isPermanent', response.isPermanent ? 'true' : 'false');
            
            resolve(this.router.createUrlTree(['/blacklist-blocked'], { 
              queryParams: {
                reason: response.reason || '',
                expiryDate: response.expiryDate || '',
                banType: response.banType || 'Temporary',
                isPermanent: response.isPermanent || false
              }
            }));
          } else {
            console.log('[AuthGuard] User is not blacklisted, continuing with normal auth check');
            // User is not blacklisted, clear any existing flags and continue
            this.auth.clearBlacklistFlags();
            resolve(this.performNormalAuthCheck(route));
          }
        },
        error: (error) => {
          console.error('[AuthGuard] Failed to check blacklist status:', error);
          // If blacklist check fails, continue with normal auth check
          resolve(this.performNormalAuthCheck(route));
        }
      });
    });
  }
  
  private performNormalAuthCheck(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const decoded = this.auth.getDecodedToken();
    let userRole = (decoded?.roles || decoded?.role || decoded?.roleName || '').toUpperCase();
    // Remove ROLE_ prefix if present
    if (userRole.startsWith('ROLE_')) {
      userRole = userRole.replace('ROLE_', '');
    }
    // Walk up the route tree to find required role
    let requiredRole = route.data['role'];
    let parent = route.parent;
    while (!requiredRole && parent) {
      requiredRole = parent.data['role'];
      parent = parent.parent;
    }
    if (requiredRole === 'customer' && userRole !== 'CUSTOMER') {
      console.log('[AuthGuard] User does not have permission for route:', route.url);
      // Silent redirect without showing any alert
      this.router.navigate(['/dashboard']);
      return false;
    }
    if (requiredRole === 'admin' && userRole === 'CUSTOMER') {
      console.log('[AuthGuard] User does not have permission for route:', route.url);
      // Silent redirect without showing any alert
      this.router.navigate(['/home']);
      return false;
    }
    // Permission check for admin routes
    const requiredPermission = route.data['permission'];
    if (requiredRole === 'admin' && requiredPermission) {
      const userPermissions = this.auth.getPermissions();
      if (!userPermissions.includes(requiredPermission)) {
        console.log('[AuthGuard] User does not have permission for route:', route.url);
        // Silent redirect without showing any alert
        this.router.navigate(['/dashboard']);
        return false;
      }
    }
    return true;
  }
  
  
}
