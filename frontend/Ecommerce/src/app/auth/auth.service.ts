import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginRequest } from '../login-request';
import { LoginResponse } from '../login-response';
import { RegisterResponse } from './auth.types';
import { RegisterRequest } from '../register-request';
import { jwtDecode } from 'jwt-decode';



@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) { }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, data);
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
  return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, data);
}



  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getDecodedToken(): any {
    const token = this.getToken();
    return token ? jwtDecode(token) : null;
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
  }

  getUsername(): string | null {
    const decoded = this.getDecodedToken();
    return decoded?.username || null;
  }

  getUserId(): number | null {
    const decoded = this.getDecodedToken();
    return decoded?.id || null;
  }

  getRoles(): string[] {
    const decoded = this.getDecodedToken();
    return decoded?.roles ? decoded.roles.split(',') : [];
  }
  verifyOtp(email: string, otp: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/verify-otp`, { email, otp });
}

resendOtp(email: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/resend-otp`, { email });
}



}
