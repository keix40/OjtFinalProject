import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private cachedIp: string | null = null;
  private fetchingIp: Promise<string> | null = null;

  constructor(private auth: AuthService) {}

  private getRealIp(): Promise<string> {
    if (this.cachedIp) {
      return Promise.resolve(this.cachedIp);
    }
    if (this.fetchingIp) {
      return this.fetchingIp;
    }
    this.fetchingIp = fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        this.cachedIp = data.ip;
        return data.ip;
      })
      .catch(() => {
        // fallback to a static IP if fetch fails
        return '204.157.172.242';
      });
    return this.fetchingIp;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    const publicEndpoints = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/verify-otp',
      '/api/auth/resend-otp'
    ];
    const isPublic = publicEndpoints.some(url => req.url.includes(url));

    // Only apply dynamic IP in development
    if (!environment.production) {
      return from(this.getRealIp()).pipe(
        switchMap(realIp => {
          let headersConfig: any = {
            'X-Forwarded-For': realIp
          };
          if (token && !isPublic) {
            headersConfig['Authorization'] = `Bearer ${token}`;
          }
          const cloned = req.clone({
            setHeaders: headersConfig
          });
          return next.handle(cloned);
        })
      );
    } else {
      // In production, do not set X-Forwarded-For
      let headersConfig: any = {};
      if (token && !isPublic) {
        headersConfig['Authorization'] = `Bearer ${token}`;
      }
      const cloned = req.clone({
        setHeaders: headersConfig
      });
      return next.handle(cloned);
    }
  }
}
