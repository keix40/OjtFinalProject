import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { LoginRequest } from '../login-request';
import { LoginResponse } from '../login-response';
import { RegisterResponse } from './auth.types';
import { RegisterRequest } from '../register-request';
import { jwtDecode } from 'jwt-decode';
import { LoginAttemptsService } from '../services/login-attempts.service';
import { switchMap, mergeMap } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';
  private publicIp: string | null = null;

  constructor(private http: HttpClient, private loginAttemptsService: LoginAttemptsService) {
    // Fetch public IP on service init
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => { this.publicIp = data.ip; });
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return from(
      fetch('https://ipinfo.io/json')
        .then(res => res.json())
        .catch(() => ({ city: '', region: '', country: '', countryCode: '' }))
    ).pipe(
      mergeMap(loc => {
        const locationString = [loc.city, loc.region, loc.country].filter(Boolean).join(', ');
        const payload = { ...data, location: locationString, countryCode: loc.country || '' };
        let headers = new HttpHeaders();
        if (this.publicIp) {
          headers = headers.set('X-Client-IP', this.publicIp);
        }
        return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload, { headers });
      })
    );
  }


  //   register(data: RegisterRequest): Observable<any> {
  //     const headers = new HttpHeaders().set('Accept', 'text/plain, application/json');
  //     return this.http.post(`${this.baseUrl}/register`, data, {
  //       headers: headers,
  //       responseType: 'text'
  //     });
  //   }

  //   register(data: RegisterRequest): Observable<RegisterResponse> {
  //   return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, data);
  // }

  register(data: any): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, data);
  }


  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getDecodedToken(): any {
    const token = this.getToken();
    return token ? jwtDecode(token) : null;
  }

  getPermissions(): string[] {
    const decoded = this.getDecodedToken();
    if (!decoded || !decoded.permissions) return [];
    return decoded.permissions.split(',');
  }

  hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    return permissions.includes(permission);
  }


  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const now = Date.now().valueOf() / 1000;
      return decoded.exp > now;
    } catch (e) {
      return false;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('email');
    localStorage.removeItem('newNotificationCount');
    // Remove any other session or user-related keys as needed
  }

  // Method to clear blacklist flags (can be called when user is removed from blacklist)
  clearBlacklistFlags() {
    localStorage.removeItem('blacklisted');
    localStorage.removeItem('blacklistReason');
    localStorage.removeItem('blacklistExpiryDate');
  }

  // Method to check if current user is blacklisted
  checkBlacklistStatus(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return new Observable(subscriber => {
        subscriber.error(new Error('No token found'));
      });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>('http://localhost:8080/api/auth/check-blacklist-status', { headers });
  }

  // Method to automatically check and clear expired blacklist flags
  checkAndClearExpiredBlacklist(): void {
    const blacklisted = localStorage.getItem('blacklisted');
    const expiryDate = localStorage.getItem('blacklistExpiryDate');
    const isPermanent = localStorage.getItem('isPermanent') === 'true';
    
    // Don't clear permanent bans automatically
    if (blacklisted === 'true' && isPermanent) {
      console.log('[Auth] User has permanent ban - not clearing automatically');
      return;
    }
    
    if (blacklisted === 'true' && expiryDate) {
      const expiry = new Date(expiryDate);
      const now = new Date();
      
      // If expiry date has passed, clear the blacklist flags
      if (expiry <= now) {
        console.log('[Auth] Blacklist expired, clearing flags');
        this.clearBlacklistFlags();
      }
    }
  }

  getUsername(): string | null {
    const decoded = this.getDecodedToken();
    return decoded?.name || null;
  }

  getUserId(): number | null {
    const decoded = this.getDecodedToken();
    return decoded?.id || null;
  }

  getRoles(): string[] {
    const decoded = this.getDecodedToken();
    return decoded?.roles ? decoded.roles.split(',') : [];
  }
  verifyOtp(email: string, otp: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/verify-otp`, { email, otp });
  }

  verifyLoginOtp(email: string, otp: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/verify-login-otp`, { email, otp });
  }

  resendOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-otp`, { email });
  }




  updateUserDetails(details: any): Observable<any> {
    const token = this.getToken();
    if (!token) {
      console.error('No token found in localStorage');
      return new Observable(subscriber => {
        subscriber.error(new Error('No token found'));
      });
    }

    console.log('Token being used:', token);
    const decoded = this.getDecodedToken();
    console.log('Decoded token:', decoded);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log('Request URL:', `${this.baseUrl}/user/${details.id}`);
    console.log('Request payload:', JSON.stringify(details, null, 2));
    console.log('Request headers:', headers);

    return this.http.put(`${this.baseUrl}/user/${details.id}`, details, { headers });
  }

  sendRegisterOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/sendOtp`, { email });
  }

  sendResetOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/send-reset-otp`, { email });
  }

  resetPassword(email: string, newPassword: string) {
    return this.http.post<any>(`${this.baseUrl}/reset-password`, { email, newPassword });
  }

  assignRoleToUser(userId: number, roleId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${userId}/assign-role?roleId=${roleId}`, {});
  }

  getUsersByRoleId(roleId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/roles/${roleId}/users`);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/all`);
  }




uploadProfileImage(file: File): Observable<any> { //add for profile avatar update by pmk june 13
  const token = this.getToken();
  if (!token) {
    console.error('No token found in localStorage');
    return new Observable(subscriber => {
      subscriber.error(new Error('No token found'));
    });
  }

  const formData = new FormData();
  formData.append('image', file);

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.put(`${this.baseUrl}/update-avatar`, formData, { headers });
}

  sendLoginOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/send-login-otp`, { email });
  }

    getUserVipTier(): string | null {
    const token = localStorage.getItem('token');
    
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.vipTier || null;
    } catch {
      return null;
    }
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post(`${this.baseUrl}/refresh-token`, { refreshToken });
  }

}
