import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface BlacklistEntry {
  id: string;
  targetType: 'email' | 'ip' | 'device' | 'phone' | 'user_id';
  targetValue: string;
  category: 'fraud' | 'spam' | 'abuse' | 'chargeback' | 'fake_account' | 'policy_violation';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  addedDate: Date;
  addedBy: string;
  status: 'active' | 'appealed' | 'expired' | 'lifted';
  expiryDate?: Date;
  associatedEmail?: string;
  deviceFingerprint?: string;
  incidentCount: number;
  notes?: string;
  isAutomatic: boolean;
  lastIncidentDate: Date;
}

export interface BlacklistStats {
  totalActive: number;
  newThisWeek: number;
  fraudPrevented: number;
  estimatedSavings: number;
  pendingAppeals: number;
  avgAppealTime: number;
}

export interface BlacklistFilters {
  search?: string;
  category?: string;
  status?: string;
  riskLevel?: string;
  page?: number;
  pageSize?: number;
}

export interface AutoRules {
  failedPayments: boolean;
  chargebacks: boolean;
  suspiciousActivity: boolean;
  multipleAccounts: boolean;
  vpnDetection: boolean;
}

export interface IncidentHistory {
  id: string;
  type: string;
  timestamp: Date;
  details: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BlacklistService {
  private apiUrl = `${environment.apiUrl}/blacklist`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('BlacklistService Error:', error);
    return throwError(() => errorMessage);
  }

  // Get blacklist entries with filters and pagination
  private cache = new Map<string, any>();

getEntries(filters: BlacklistFilters): Observable<{
  entries: BlacklistEntry[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const cacheKey = JSON.stringify(filters);
  if (this.cache.has(cacheKey)) {
    return of(this.cache.get(cacheKey));
  }

  let params = new HttpParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== null &&
      value !== undefined &&
      !(typeof value === 'string' && value.trim() === '')
    ) {
      params = params.append(key, value.toString());
    }
  });
  
  return this.http.get<{
    entries: BlacklistEntry[];
    total: number;
    totalPages: number;
    currentPage: number;
  }>(
    `${this.apiUrl}/entries`,
    { params, withCredentials: true }
  ).pipe(
    retry(1),
    tap(data => this.cache.set(cacheKey, data)),
    catchError(this.handleError)
  );
}

  // Get blacklist statistics
  getStats(): Observable<BlacklistStats> {
    return this.http.get<BlacklistStats>(
      `${this.apiUrl}/stats`,
      { withCredentials: true }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Add new blacklist entry
  addEntry(entry: Partial<BlacklistEntry>): Observable<BlacklistEntry> {
    return this.http.post<BlacklistEntry>(
      `${this.apiUrl}/entries`,
      entry,
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Update existing entry
  updateEntry(id: string, updates: Partial<BlacklistEntry>): Observable<BlacklistEntry> {
    return this.http.put<BlacklistEntry>(
      `${this.apiUrl}/entries/${id}`,
      updates,
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Get single entry details
  getEntry(id: string): Observable<BlacklistEntry> {
    return this.http.get<BlacklistEntry>(
      `${this.apiUrl}/entries/${id}`,
      { withCredentials: true }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Lift ban
  liftBan(id: string, reason?: string): Observable<BlacklistEntry> {
    return this.http.post<BlacklistEntry>(
      `${this.apiUrl}/entries/${id}/lift`,
      { reason },
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Bulk lift bans
  bulkLiftBan(ids: string[], reason?: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/entries/bulk-lift`,
      { ids, reason },
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Add note to entry
  addNote(id: string, note: string): Observable<BlacklistEntry> {
    return this.http.post<BlacklistEntry>(
      `${this.apiUrl}/entries/${id}/notes`,
      { note },
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Get auto rules configuration
  getAutoRules(): Observable<AutoRules> {
    return this.http.get<AutoRules>(
      `${this.apiUrl}/auto-rules`,
      { withCredentials: true }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Update auto rules
  updateAutoRules(rules: Partial<AutoRules>): Observable<AutoRules> {
    return this.http.put<AutoRules>(
      `${this.apiUrl}/auto-rules`,
      rules,
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Export blacklist entries
  exportEntries(filters: BlacklistFilters): Observable<Blob> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params = params.append(key, value.toString());
      }
    });
    return this.http.get(
      `${this.apiUrl}/export`,
      {
        params,
        responseType: 'blob',
        withCredentials: true
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Get incident history for an entry
  getIncidentHistory(id: string): Observable<IncidentHistory[]> {
    return this.http.get<IncidentHistory[]>(
      `${this.apiUrl}/entries/${id}/incidents`,
      { withCredentials: true }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // Extend ban duration
  extendBan(id: string, newExpiryDate: Date): Observable<BlacklistEntry> {
    return this.http.post<BlacklistEntry>(
      `${this.apiUrl}/entries/${id}/extend`,
      { expiryDate: newExpiryDate },
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Bulk extend bans
  bulkExtendBan(ids: string[], newExpiryDate: Date): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/entries/bulk-extend`,
      {
        ids,
        expiryDate: newExpiryDate
      },
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Update category for multiple entries
  bulkUpdateCategory(ids: string[], category: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/entries/bulk-category`,
      {
        ids,
        category
      },
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  
} 