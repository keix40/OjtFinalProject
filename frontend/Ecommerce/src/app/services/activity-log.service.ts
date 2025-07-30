import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  actionType: string;
  entityType: string;
  entityId: string;
  description: string;
  severityLevel: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  timestamp: string;
  details: string;
  changes: any; // allow string or object
  status: string;
  errorMessage: string;
}

export interface ActivityLogFilter {
  dateFrom?: string;
  dateTo?: string;
  userId?: number;
  actionTypes?: string[];
  severityLevels?: string[];
  ipAddress?: string;
  searchTerm?: string;
  entityType?: string;
  page?: number;
  size?: number;
}

export interface ActivityLogResponse {
  logs: ActivityLog[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface ActivityStatistics {
  totalLogs: number;
  uniqueUsers: number;
  criticalEvents: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {

  private apiUrl = `${environment.apiUrl}/activity-logs`;

  constructor(private http: HttpClient) { }

  // Get activity logs with filters
  getActivityLogs(filter: ActivityLogFilter): Observable<ActivityLogResponse> {
    return this.http.post<ActivityLogResponse>(`${this.apiUrl}/search`, filter);
  }

  // Get activity log by ID
  getActivityLogById(id: number): Observable<ActivityLog> {
    return this.http.get<ActivityLog>(`${this.apiUrl}/${id}`);
  }

  // Get recent activity logs
  getRecentActivityLogs(page: number = 0, size: number = 25): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.apiUrl}/recent`, { params });
  }

  // Get critical activity logs
  getCriticalActivityLogs(page: number = 0, size: number = 25): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.apiUrl}/critical`, { params });
  }

  // Get activity logs by user
  getActivityLogsByUser(userId: number, page: number = 0, size: number = 25): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`, { params });
  }

  // Get activity logs by action type
  getActivityLogsByActionType(actionType: string, page: number = 0, size: number = 25): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.apiUrl}/action/${actionType}`, { params });
  }

  // Get activity logs by entity type
  getActivityLogsByEntityType(entityType: string, page: number = 0, size: number = 25): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.apiUrl}/entity/${entityType}`, { params });
  }

  // Get activity logs by severity level
  getActivityLogsBySeverityLevel(severityLevel: string, page: number = 0, size: number = 25): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.apiUrl}/severity/${severityLevel}`, { params });
  }

  // Get activity logs by time range
  getActivityLogsByTimeRange(startDate: string, endDate: string, page: number = 0, size: number = 25): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.apiUrl}/time-range`, { params });
  }

  // Get activity statistics
  getActivityStatistics(): Observable<ActivityStatistics> {
    return this.http.get<ActivityStatistics>(`${this.apiUrl}/statistics`);
  }

  // Get activity counts by action type
  getActivityCountsByActionType(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/statistics/action-types`);
  }

  // Get activity counts by severity level
  getActivityCountsBySeverityLevel(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/statistics/severity-levels`);
  }

  // Get activity counts by entity type
  getActivityCountsByEntityType(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/statistics/entity-types`);
  }

  // Get activity counts by user role
  getActivityCountsByUserRole(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/statistics/user-roles`);
  }

  // Get unique users
  getUniqueUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  // Export activity logs
  exportActivityLogs(filter: ActivityLogFilter, format: string): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    return this.http.post(`${this.apiUrl}/export`, filter, {
      params,
      responseType: 'blob'
    });
  }

  // Update activity log status
  updateActivityLogStatus(id: number, status: string, errorMessage?: string): Observable<ActivityLog> {
    const params = new HttpParams()
      .set('status', status);
    if (errorMessage) {
      params.set('errorMessage', errorMessage);
    }
    return this.http.put<ActivityLog>(`${this.apiUrl}/${id}/status`, null, { params });
  }

  // Delete old activity logs
  deleteOldActivityLogs(daysToKeep: number = 90): Observable<string> {
    const params = new HttpParams().set('daysToKeep', daysToKeep.toString());
    return this.http.delete<string>(`${this.apiUrl}/cleanup`, { params });
  }

  // Create activity log (for testing)
  createActivityLog(activityLog: ActivityLog): Observable<ActivityLog> {
    return this.http.post<ActivityLog>(this.apiUrl, activityLog);
  }
} 