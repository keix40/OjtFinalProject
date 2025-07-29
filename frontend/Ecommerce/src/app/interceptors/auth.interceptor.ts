import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip authentication for appeal submission
    if (request.url.includes('/api/appeals/submit') && request.method === 'POST') {
      console.log('[AuthInterceptor] Skipping authentication for appeal submission');
      
      // Create a clean request without any auth headers for appeal submission
      const cleanRequest = request.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      return next.handle(cleanRequest).pipe(
        catchError((error: HttpErrorResponse) => {
          console.log('[AuthInterceptor] Appeal submission error:', error.status, error.error);
          return throwError(() => error);
        })
      );
    }

    // Add auth token to request
    const token = this.authService.getToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('[AuthInterceptor] Error caught:', error.status, error.error);
        
        // Handle blacklist responses (403 with blocked flag)
        if (error.status === 403 && error.error?.blocked) {
          console.log('[AuthInterceptor] Blacklist response detected:', error.error);
          // User is blacklisted, set flags and redirect
          localStorage.setItem('blacklisted', 'true');
          localStorage.setItem('blacklistReason', error.error.reason || '');
          localStorage.setItem('blacklistExpiryDate', error.error.expiryDate || '');
          localStorage.setItem('banType', error.error.banType || 'Temporary');
          localStorage.setItem('isPermanent', error.error.isPermanent ? 'true' : 'false');
          
          // Redirect to blacklist-blocked page
          this.router.navigate(['/blacklist-blocked'], {
            queryParams: {
              reason: error.error.reason,
              expiryDate: error.error.expiryDate,
              banType: error.error.banType,
              isPermanent: error.error.isPermanent
            }
          });
          return throwError(() => error);
        }
        
        // Handle other errors
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        
        return throwError(() => error);
      })
    );
  }
} 