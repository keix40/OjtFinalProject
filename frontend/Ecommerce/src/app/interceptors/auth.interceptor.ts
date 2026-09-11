import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshing = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const withCreds = request.clone({ withCredentials: true });

    if (request.url.includes('/api/appeals/submit') && request.method === 'POST') {
      return next.handle(withCreds);
    }

    return next.handle(withCreds).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, withCreds, next))
    );
  }

  private handleError(
    error: HttpErrorResponse,
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (error.status === 403 && error.error?.banned) {
      localStorage.setItem('ipBanned', 'true');
      localStorage.setItem('ipBanMessage', error.error.message || '');
      this.router.navigate(['/ip-banned']);
      return throwError(() => error);
    }

    if (error.status === 403 && error.error?.blocked) {
      localStorage.setItem('blacklisted', 'true');
      localStorage.setItem('blacklistReason', error.error.reason || '');
      localStorage.setItem('blacklistExpiryDate', error.error.expiryDate || '');
      this.router.navigate(['/blacklist-blocked']);
      return throwError(() => error);
    }

    if (error.status === 401 && !request.url.includes('/api/auth/login') && !request.url.includes('/api/auth/refresh-token')) {
      if (!this.refreshing && this.authService.getSession()) {
        this.refreshing = true;
        return from(this.authService.refreshToken().toPromise()).pipe(
          switchMap(() => {
            this.refreshing = false;
            return next.handle(request.clone({ withCredentials: true }));
          }),
          catchError(refreshErr => {
            this.refreshing = false;
            this.authService.clearLocalState();
            if (!this.router.url.startsWith('/login')) {
              this.router.navigate(['/login']);
            }
            return throwError(() => refreshErr);
          })
        );
      }
      if (this.authService.getSession()) {
        this.authService.clearLocalState();
        if (!this.router.url.startsWith('/login')) {
          this.router.navigate(['/login']);
        }
      }
    }

    return throwError(() => error);
  }
}
