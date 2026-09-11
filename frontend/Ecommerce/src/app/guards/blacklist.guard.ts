import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class BlacklistGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Promise<boolean | UrlTree> {
    if (localStorage.getItem('blacklisted') === 'true') {
      if (state.url !== '/blacklist-blocked') {
        return this.router.createUrlTree(['/blacklist-blocked'], {
          queryParams: {
            reason: localStorage.getItem('blacklistReason') || '',
            expiryDate: localStorage.getItem('blacklistExpiryDate') || '',
            banType: localStorage.getItem('banType') || 'Temporary',
            isPermanent: localStorage.getItem('isPermanent') || 'false'
          }
        });
      }
      return true;
    }

    if (this.authService.isLoggedIn()) {
      return new Promise<boolean | UrlTree>((resolve) => {
        this.authService.checkBlacklistStatus().subscribe({
          next: (response) => {
            if (response.blacklisted) {
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
              this.authService.clearBlacklistFlags();
              resolve(true);
            }
          },
          error: () => resolve(this.router.createUrlTree(['/login']))
        });
      });
    }

    return true;
  }
}
