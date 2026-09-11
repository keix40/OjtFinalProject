import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/** Adds withCredentials and optional dev X-Forwarded-For — auth tokens are HttpOnly cookies. */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private cachedIp: string | null = null;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!environment.production) {
      return from(this.getRealIp()).pipe(
        switchMap(realIp => next.handle(req.clone({
          withCredentials: true,
          setHeaders: { 'X-Forwarded-For': realIp }
        })))
      );
    }
    return next.handle(req.clone({ withCredentials: true }));
  }

  private getRealIp(): Promise<string> {
    if (this.cachedIp) return Promise.resolve(this.cachedIp);
    return fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        this.cachedIp = data.ip;
        return data.ip;
      })
      .catch(() => '127.0.0.1');
  }
}
