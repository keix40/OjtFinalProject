import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginAttempt {
  id: number;
  username: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  timestamp: string;
  status: string;
  threatLevel: string;
  threatScore: number;
  attemptCount: number;
  timeframe: string;
  isVPN: boolean;
  isProxy: boolean;
  isBlocked: boolean;
  sessionId: string;
  countryCode: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class LoginAttemptsService {
  private apiUrl = 'http://localhost:8080/api/login-attempts';

  constructor(private http: HttpClient) {}

  // 🔁 Get all login attempts
  getAll(): Observable<LoginAttempt[]> {
    return this.http.get<LoginAttempt[]>(`${this.apiUrl}`);
  }

  // 🔍 Filter by status
  getByStatus(status: string): Observable<LoginAttempt[]> {
    return this.http.get<LoginAttempt[]>(`${this.apiUrl}/status/${status}`);
  }

  // 🔍 Filter by threat level
  getByThreatLevel(level: string): Observable<LoginAttempt[]> {
    return this.http.get<LoginAttempt[]>(`${this.apiUrl}/threat/${level}`);
  }

  // 🔎 Search
  search(keyword: string): Observable<LoginAttempt[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<LoginAttempt[]>(`${this.apiUrl}/search`, { params });
  }

  // 🧠 Filter + sort + time range
  filterAttempts(
    status?: string,
    threatLevel?: string,
    searchTerm?: string,
    startDate?: string,
    endDate?: string,
    sortBy: string = 'timestamp',
    direction: string = 'desc'
  ): Observable<LoginAttempt[]> {
    let params = new HttpParams()
      .set('sortBy', sortBy)
      .set('direction', direction);

    if (status) params = params.set('status', status);
    if (threatLevel) params = params.set('threatLevel', threatLevel);
    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<LoginAttempt[]>(`${this.apiUrl}/filter`, { params });
  }

  // 🔄 Paginated filter + search
  getPagedAttempts(
    page: number,
    size: number,
    sortBy: string = 'timestamp',
    direction: string = 'desc',
    status?: string,
    threatLevel?: string,
    searchTerm?: string
  ): Observable<PagedResponse<LoginAttempt>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);

    if (status) params = params.set('status', status);
    if (threatLevel) params = params.set('threatLevel', threatLevel);
    if (searchTerm) params = params.set('searchTerm', searchTerm);

    return this.http.get<PagedResponse<LoginAttempt>>(`${this.apiUrl}/paged`, { params });
  }

  // 🚫 Block IP
  blockIP(ip: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/block-ip`, null, {
      params: new HttpParams().set('ip', ip)
    });
  }

  // ✅ Whitelist IP
  whitelistIP(ip: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/whitelist-ip`, null, {
      params: new HttpParams().set('ip', ip)
    });
  }

  // 📋 Bulk block
  bulkBlock(ipList: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/block-ip/bulk`, ipList);
  }

  getBySessionId(sessionId: string) {
    return this.http.get<LoginAttempt[]>(`${this.apiUrl}/session/${sessionId}`);
  }

  blockSession(sessionId: string) {
    return this.http.post(`${this.apiUrl}/block-session`, null, { params: { sessionId } });
  }

  whitelistSession(sessionId: string) {
    return this.http.post(`${this.apiUrl}/whitelist-session`, null, { params: { sessionId } });
  }
}
