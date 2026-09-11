import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { LoginRequest } from '../login-request';
import { LoginResponse } from '../login-response';
import { RegisterResponse } from './auth.types';
import { mergeMap, tap, catchError, map } from 'rxjs/operators';
import { PermissionService } from '../services/permission.service';
import { environment } from '../../environments/environment';

/** Auth session from /api/auth/me. Profile fields are optional — fetch full profile via UserService when needed. */
export interface SessionUser {
  id: number;
  sub: string;
  email?: string;
  name: string;
  roles: string;
  permissions: string;
  verified?: boolean;
  vipTier?: string | null;
  profileImage?: string | null;
  gender?: string | null;
  dateofbirth?: string | null;
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  phNumber?: string | null;
  totalPoints?: number;
  avatar?: string | null;
  image?: string | null;
  roleLevel?: number;
  role?: string;
  roleName?: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;
  private publicIp: string | null = null;
  private sessionSubject = new BehaviorSubject<SessionUser | null>(null);
  readonly session$ = this.sessionSubject.asObservable();

  constructor(
    private http: HttpClient,
    private permissionService: PermissionService
  ) {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => { this.publicIp = data.ip; })
      .catch(() => undefined);
  }

  private httpOptions = { withCredentials: true };

  login(data: LoginRequest): Observable<LoginResponse> {
    return fromLocation().pipe(
      mergeMap(loc => {
        const locationString = [loc.city, loc.region, loc.country].filter(Boolean).join(', ');
        const payload = { ...data, location: locationString, countryCode: loc.country || '' };
        let headers = new HttpHeaders();
        if (this.publicIp) {
          headers = headers.set('X-Client-IP', this.publicIp);
        }
        return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload, {
          headers,
          withCredentials: true
        });
      })
    );
  }

  register(data: any): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, data, this.httpOptions);
  }

  /** Load session from HttpOnly cookie via /me — replaces localStorage token reads. */
  loadSession(): Observable<SessionUser | null> {
    return this.http.get<SessionUser>(`${this.baseUrl}/me`, this.httpOptions).pipe(
      tap(session => this.applySession(session)),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  establishSession(): Observable<SessionUser | null> {
    return this.loadSession();
  }

  private applySession(session: SessionUser): void {
    this.sessionSubject.next(session);
    const permissionArray = (session.permissions || '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);
    this.permissionService.setPermissions(permissionArray);
    if (session.sub) {
      sessionStorage.setItem('email', session.sub);
    }
  }

  private clearSession(): void {
    this.sessionSubject.next(null);
    this.permissionService.setPermissions([]);
  }

  /** @deprecated Tokens are HttpOnly cookies — use getSession() instead. */
  saveToken(_token: string) {
    // no-op: cookies are set by the server
  }

  getSession(): SessionUser | null {
    return this.sessionSubject.value;
  }

  getDecodedToken(): SessionUser | null {
    return this.getSession();
  }

  getPermissions(): string[] {
    const session = this.getSession();
    if (!session?.permissions) return [];
    return session.permissions.split(',').map(p => p.trim()).filter(Boolean);
  }

  hasPermission(permission: string): boolean {
    return this.getPermissions().includes(permission);
  }

  getToken(): string | null {
    return this.getSession() ? 'cookie-session' : null;
  }

  isLoggedIn(): boolean {
    return this.getSession() != null;
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}, this.httpOptions).pipe(
      tap(() => this.clearLocalState())
    );
  }

  clearLocalState(): void {
    this.clearSession();
    sessionStorage.removeItem('email');
    localStorage.removeItem('blacklisted');
    localStorage.removeItem('blacklistReason');
    localStorage.removeItem('blacklistExpiryDate');
    localStorage.removeItem('banType');
    localStorage.removeItem('isPermanent');
    localStorage.removeItem('newNotificationCount');
    // Remove legacy token keys if present
    localStorage.removeItem('token');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userPermissions');
  }

  clearBlacklistFlags() {
    localStorage.removeItem('blacklisted');
    localStorage.removeItem('blacklistReason');
    localStorage.removeItem('blacklistExpiryDate');
  }

  checkBlacklistStatus(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/check-blacklist-status`, this.httpOptions);
  }

  checkAndClearExpiredBlacklist(): void {
    const blacklisted = localStorage.getItem('blacklisted');
    const expiryDate = localStorage.getItem('blacklistExpiryDate');
    const isPermanent = localStorage.getItem('isPermanent') === 'true';
    if (blacklisted === 'true' && isPermanent) return;
    if (blacklisted === 'true' && expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry <= new Date()) {
        this.clearBlacklistFlags();
      }
    }
  }

  getUsername(): string | null {
    return this.getSession()?.name ?? null;
  }

  getUserId(): number | null {
    return this.getSession()?.id ?? null;
  }

  getRoles(): string[] {
    const roles = this.getSession()?.roles;
    return roles ? roles.split(',').map(r => r.trim()).filter(Boolean) : [];
  }

  redirectPathForRoles(roles?: string[] | string): string {
    const list = Array.isArray(roles)
      ? roles
      : typeof roles === 'string'
        ? roles.split(',')
        : this.getRoles();
    const normalized = list
      .map(r => r.trim().toUpperCase().replace(/^ROLE_/, ''))
      .filter(Boolean);
    return normalized.includes('CUSTOMER') ? '/home' : '/dashboard';
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-otp`, { email, otp }, this.httpOptions);
  }

  verifyLoginOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-login-otp`, { email, otp }, this.httpOptions).pipe(
      tap(() => this.loadSession().subscribe())
    );
  }

  resendOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-otp`, { email }, this.httpOptions);
  }

  updateUserDetails(details: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/user/${details.id}`, details, {
      ...this.httpOptions,
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  sendRegisterOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/sendOtp`, { email }, this.httpOptions);
  }

  sendResetOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/send-reset-otp`, { email }, this.httpOptions);
  }

  resetPassword(email: string, otp: string, newPassword: string) {
    return this.http.post<any>(`${this.baseUrl}/reset-password`, { email, otp, newPassword }, this.httpOptions);
  }

  assignRoleToUser(userId: number, roleId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${userId}/assign-role?roleId=${roleId}`, {}, this.httpOptions);
  }

  getUsersByRoleId(roleId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/roles/${roleId}/users`, this.httpOptions);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/all`, this.httpOptions);
  }

  uploadProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.put(`${this.baseUrl}/update-avatar`, formData, this.httpOptions);
  }

  getUserVipTier(): string | null {
    return this.getSession()?.vipTier ?? null;
  }

  refreshToken(): Observable<any> {
    return this.http.post(`${this.baseUrl}/refresh-token`, {}, this.httpOptions).pipe(
      tap(() => this.loadSession().subscribe())
    );
  }
}

function fromLocation(): Observable<{ city?: string; region?: string; country?: string }> {
  return new Observable(subscriber => {
    fetch('https://ipinfo.io/json')
      .then(res => res.json())
      .then(data => {
        subscriber.next(data);
        subscriber.complete();
      })
      .catch(() => {
        subscriber.next({});
        subscriber.complete();
      });
  });
}
