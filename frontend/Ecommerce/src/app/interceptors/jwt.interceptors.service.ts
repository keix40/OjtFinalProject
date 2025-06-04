import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();

    // List of endpoints that don't require Authorization header
    const publicEndpoints = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/verify-otp',
      '/api/auth/resend-otp'
    ];

    // Check if the request URL contains any public endpoint
    const isPublic = publicEndpoints.some(url => req.url.includes(url));

    // Only add the token if it exists and request is NOT to a public endpoint
    if (token && !isPublic) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req);
  }
}
