import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface BlacklistEntry {
  id: string;
  targetType: 'EMAIL' | 'IP' | 'DEVICE' | 'PHONE' | 'USER_ID';
  targetValue: string;
  category: 'FRAUD' | 'SPAM' | 'ABUSE' | 'CHARGEBACK' | 'FAKE_ACCOUNT' | 'POLICY_VIOLATION';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  addedDate: Date;
  addedBy: string;
  status: 'ACTIVE' | 'APPEALED' | 'EXPIRED' | 'LIFTED';
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
  trends?: {
    fraudTrend: number;
    fraudTrendDirection: 'up' | 'down' | 'stable';
    entriesTrend: number;
    entriesTrendDirection: 'up' | 'down' | 'stable';
  };
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

export interface Appeal {
  id: string;
  blacklistEntryId?: string;
  userEmail: string;
  appealReason: 'WRONGFUL_BAN' | 'MISTAKEN_IDENTITY' | 'ACCOUNT_COMPROMISED' | 'TECHNICAL_ERROR' | 'OTHER';
  appealDetails: string;
  contactEmail: string;
  submittedAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
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
    console.log('[BlacklistService] liftBan called with ID:', id, 'reason:', reason);
    console.log('[BlacklistService] API URL:', `${this.apiUrl}/entries/${id}/lift`);
    
    return this.http.post<BlacklistEntry>(
      `${this.apiUrl}/entries/${id}/lift`,
      { reason },
      { withCredentials: true }
    ).pipe(
      tap(response => {
        console.log('[BlacklistService] Lift ban response:', response);
        // Clear blacklist flags from localStorage if this is the current user
        const currentUserEmail = this.getCurrentUserEmail();
        if (currentUserEmail && response.targetValue === currentUserEmail) {
          console.log('[BlacklistService] Clearing blacklist flags for current user');
          localStorage.removeItem('blacklisted');
          localStorage.removeItem('blacklistReason');
          localStorage.removeItem('blacklistExpiryDate');
          localStorage.removeItem('banType');
          localStorage.removeItem('isPermanent');
          
          // Force page refresh to update the UI immediately
          console.log('[BlacklistService] Forcing page refresh for current user');
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Wait 1 second for the success message to show
        }
      }),
      catchError(error => {
        console.error('[BlacklistService] Lift ban error:', error);
        return this.handleError(error);
      })
    );
  }

  private getCurrentUserEmail(): string | null {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email || payload.sub;
      }
    } catch (error) {
      console.error('[BlacklistService] Error parsing token:', error);
    }
    return null;
  }

  // Method to check if current user is still blacklisted
  checkCurrentUserBlacklistStatus(): Observable<boolean> {
    const currentUserEmail = this.getCurrentUserEmail();
    if (!currentUserEmail) {
      return of(false);
    }

    return this.http.get<any>(`${environment.apiUrl}/auth/check-blacklist-status`, { withCredentials: true })
      .pipe(
        map(response => {
          const isBlacklisted = response.blacklisted || false;
          console.log('[BlacklistService] Current user blacklist status:', isBlacklisted);
          
          // If user is not blacklisted, clear localStorage flags
          if (!isBlacklisted) {
            console.log('[BlacklistService] User is not blacklisted, clearing flags');
            localStorage.removeItem('blacklisted');
            localStorage.removeItem('blacklistReason');
            localStorage.removeItem('blacklistExpiryDate');
            localStorage.removeItem('banType');
            localStorage.removeItem('isPermanent');
          }
          
          return isBlacklisted;
        }),
        catchError(error => {
          console.error('[BlacklistService] Error checking blacklist status:', error);
          return of(false);
        })
      );
  }

  // Method to find related accounts
  findRelatedAccounts(targetType: string, targetValue: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/related-accounts`, {
      params: { targetType, targetValue }
    }).pipe(
      catchError(this.handleError)
    );
  }

  submitAppeal(appealData: any): Observable<any> {
    console.log('[BlacklistService] Submitting appeal with data:', appealData);
    return this.http.post<any>(`${environment.apiUrl}/appeals/submit`, appealData, {
      withCredentials: true
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('[BlacklistService] Appeal submission error:', error);
        console.error('[BlacklistService] Error status:', error.status);
        console.error('[BlacklistService] Error message:', error.message);
        console.error('[BlacklistService] Error body:', error.error);
        
        // Don't redirect to login for appeal submission errors
        if (error.status === 401 || error.status === 403) {
          // Return a specific error message instead of throwing
          return throwError(() => new Error(`Appeal submission failed (${error.status}): ${error.error?.message || error.message}`));
        }
        
        return throwError(() => new Error(error.error?.message || 'Failed to submit appeal'));
      })
    );
  }

  // Bulk lift bans
  bulkLiftBan(ids: string[], reason?: string): Observable<void> {
    console.log('[BlacklistService] bulkLiftBan called with IDs:', ids, 'reason:', reason);
    return this.http.post<void>(
      `${this.apiUrl}/entries/bulk-lift`,
      { ids, reason },
      { withCredentials: true }
    ).pipe(
      tap(() => console.log('[BlacklistService] bulkLiftBan request sent successfully')),
      catchError(error => {
        console.error('[BlacklistService] bulkLiftBan error:', error);
        return this.handleError(error);
      })
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
    // Format date as LocalDateTime string for backend
    const formattedDate = newExpiryDate.toISOString().slice(0, 19); // Remove milliseconds and timezone
    
    return this.http.post<BlacklistEntry>(
      `${this.apiUrl}/entries/${id}/extend`,
      { expiryDate: formattedDate },
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Bulk extend bans
  bulkExtendBan(ids: string[], newExpiryDate: Date): Observable<void> {
    // Format date as LocalDateTime string for backend
    const formattedDate = newExpiryDate.toISOString().slice(0, 19); // Remove milliseconds and timezone
    console.log('[BlacklistService] bulkExtendBan called with IDs:', ids, 'formatted date:', formattedDate);
    
    return this.http.post<void>(
      `${this.apiUrl}/entries/bulk-extend`,
      {
        ids,
        expiryDate: formattedDate
      },
      { withCredentials: true }
    ).pipe(
      tap(() => console.log('[BlacklistService] bulkExtendBan request sent successfully')),
      catchError(error => {
        console.error('[BlacklistService] bulkExtendBan error:', error);
        return this.handleError(error);
      })
    );
  }

  // Update category for multiple entries
  bulkUpdateCategory(ids: string[], category: string): Observable<void> {
    console.log('[BlacklistService] bulkUpdateCategory called with IDs:', ids, 'category:', category);
    return this.http.post<void>(
      `${this.apiUrl}/entries/bulk-category`,
      {
        ids,
        category
      },
      { withCredentials: true }
    ).pipe(
      tap(() => console.log('[BlacklistService] bulkUpdateCategory request sent successfully')),
      catchError(error => {
        console.error('[BlacklistService] bulkUpdateCategory error:', error);
        return this.handleError(error);
      })
    );
  }

  getAppealStats(): Observable<Map<string, Object>> {
    console.log('Fetching appeal stats...');
    return this.http.get<Map<string, Object>>(`${environment.apiUrl}/appeals/stats`, { withCredentials: true }).pipe(
      tap(response => console.log('Appeal stats received:', response)),
      catchError(error => {
        console.error('Error fetching appeal stats:', error);
        return this.handleError(error);
      })
    );
  }

  // Appeal management methods
  getAppeals(): Observable<Appeal[]> {
    console.log('Fetching all appeals...');
    return this.http.get<Appeal[]>(`${environment.apiUrl}/appeals`, { withCredentials: true }).pipe(
      tap(response => console.log('Appeals received:', response)),
      catchError(error => {
        console.error('Error fetching appeals:', error);
        return this.handleError(error);
      })
    );
  }

  getPendingAppeals(): Observable<Appeal[]> {
    console.log('Fetching pending appeals...');
    return this.http.get<Appeal[]>(`${environment.apiUrl}/appeals/pending`, { withCredentials: true }).pipe(
      tap(response => console.log('Pending appeals received:', response)),
      catchError(error => {
        console.error('Error fetching pending appeals:', error);
        return this.handleError(error);
      })
    );
  }

  getAppealById(id: string): Observable<Appeal> {
    console.log('Fetching appeal by ID:', id);
    return this.http.get<Appeal>(`${environment.apiUrl}/appeals/${id}`, { withCredentials: true }).pipe(
      tap(response => console.log('Appeal by ID received:', response)),
      catchError(error => {
        console.error('Error fetching appeal by ID:', error);
        return this.handleError(error);
      })
    );
  }

  reviewAppeal(id: string, reviewData: any): Observable<Appeal> {
    console.log('Reviewing appeal:', id, 'with data:', reviewData);
    return this.http.post<Appeal>(`${environment.apiUrl}/appeals/${id}/review`, reviewData, { withCredentials: true }).pipe(
      tap(response => console.log('Appeal review response:', response)),
      catchError(error => {
        console.error('Error reviewing appeal:', error);
        return this.handleError(error);
      })
    );
  }

  
} 