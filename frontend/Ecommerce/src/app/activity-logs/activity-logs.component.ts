import { Component, OnInit, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { ActivityLogService, ActivityLogFilter, ActivityLogResponse, ActivityStatistics } from '../services/activity-log.service';

declare var lucide: any;

interface LogFilters {
  dateFrom: string;
  dateTo: string;
  userId: string;
  actionTypes: string[];
  severityLevels: string[];
  ipAddress: string;
  searchTerm: string;
}

// Update the ActivityLog interface to allow 'changes' to be string or object
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

@Component({
  selector: 'app-activity-logs',
  templateUrl: './activity-logs.component.html',
  standalone: false,
  styleUrls: ['./activity-logs.component.css']
})
export class ActivityLogsComponent implements OnInit, AfterViewInit {
  // Data properties
  allLogs: ActivityLog[] = [];
  filteredLogs: ActivityLog[] = [];
  paginatedLogs: ActivityLog[] = [];
  selectedLog: ActivityLog | null = null;

  // Filter properties
  filters: LogFilters = {
    dateFrom: '',
    dateTo: '',
    userId: '',
    actionTypes: [],
    severityLevels: [],
    ipAddress: '',
    searchTerm: ''
  };

  // UI state
  isLoading = false;
  viewMode: 'detailed' | 'compact' = 'detailed';
  selectedDateRange = '';
  showExportDropdown = false;
  showExportSuccess = false;
  exportSuccessMessage = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 25;
  totalPages = 1;

  // Statistics
  statistics: ActivityStatistics = {
    totalLogs: 0,
    uniqueUsers: 0,
    criticalEvents: 0
  };

  // Utility property
  Math = Math;

  // Configuration
  dateRanges = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7days' },
    { label: '30 Days', value: '30days' },
    { label: '90 Days', value: '90days' }
  ];

  actionTypes = [
    { value: 'LOGIN', label: 'Login', icon: 'log-in' },
    { value: 'LOGOUT', label: 'Logout', icon: 'log-out' },
    { value: 'CREATE', label: 'Create', icon: 'plus' },
    { value: 'UPDATE', label: 'Update', icon: 'edit-3' },
    { value: 'DELETE', label: 'Delete', icon: 'trash-2' },
    { value: 'VIEW', label: 'View', icon: 'eye' },
    { value: 'EXPORT', label: 'Export', icon: 'download' },
    { value: 'IMPORT', label: 'Import', icon: 'upload' },
    { value: 'SECURITY', label: 'Security', icon: 'shield' },
    { value: 'SYSTEM', label: 'System', icon: 'settings' }
  ];

  severityLevels = [
    { value: 'LOW', label: 'Low', icon: 'info' },
    { value: 'MEDIUM', label: 'Medium', icon: 'alert-triangle' },
    { value: 'HIGH', label: 'High', icon: 'alert-circle' },
    { value: 'CRITICAL', label: 'Critical', icon: 'x-circle' }
  ];

  constructor(
    private activityLogService: ActivityLogService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadActivityLogs();
    this.loadStatistics();
    this.setDefaultDateRange();
  }

  ngAfterViewInit(): void {
    this.initializeIcons();
  }

  private initializeIcons(): void {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    } else if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).lucide) {
        (window as any).lucide.createIcons();
      } else if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 100);
  }

  loadActivityLogs(): void {
    this.isLoading = true;
    
    const filter: ActivityLogFilter = {
      page: this.currentPage - 1,
      size: this.itemsPerPage
    };

    this.activityLogService.getActivityLogs(filter).subscribe({
      next: (response: ActivityLogResponse) => {
        // Parse changes for all logs
        response.logs.forEach(log => {
          if (typeof log.changes === 'string') {
            try {
              log.changes = JSON.parse(log.changes);
            } catch (e) {
              log.changes = {};
            }
          }
        });
        this.allLogs = response.logs;
        this.filteredLogs = response.logs;
        this.paginatedLogs = response.logs;
        this.totalPages = response.totalPages;
        this.currentPage = response.currentPage + 1;
      this.isLoading = false;
        // Update totalLogs from backend response if available
        if (typeof response.totalElements === 'number') {
          this.statistics.totalLogs = response.totalElements;
        }
      setTimeout(() => {
        this.initializeIcons();
      }, 100);
      },
      error: (error) => {
        console.error('Error loading activity logs:', error);
        this.isLoading = false;
      }
    });
  }

  loadStatistics(): void {
    this.activityLogService.getActivityStatistics().subscribe({
      next: (stats: ActivityStatistics) => {
        this.statistics = stats;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
    }
    });
  }

  setDefaultDateRange(): void {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    this.filters.dateFrom = sevenDaysAgo.toISOString().split('T')[0];
    this.filters.dateTo = today.toISOString().split('T')[0];
    this.selectedDateRange = '7days';
  }

  selectDateRange(range: string): void {
    this.selectedDateRange = range;
    const today = new Date();
    
    switch (range) {
      case 'today':
        this.filters.dateFrom = today.toISOString().split('T')[0];
        this.filters.dateTo = today.toISOString().split('T')[0];
        break;
      case '7days':
        this.filters.dateFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        this.filters.dateTo = today.toISOString().split('T')[0];
        break;
      case '30days':
        this.filters.dateFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        this.filters.dateTo = today.toISOString().split('T')[0];
        break;
      case '90days':
        this.filters.dateFrom = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        this.filters.dateTo = today.toISOString().split('T')[0];
        break;
    }
    
    this.applyFilters();
  }

  applyFilters(): void {
    this.isLoading = true;
    
    const filter: ActivityLogFilter = {
      dateFrom: this.filters.dateFrom,
      dateTo: this.filters.dateTo,
      userId: this.filters.userId ? parseInt(this.filters.userId) : undefined,
      actionTypes: this.filters.actionTypes.length > 0 ? this.filters.actionTypes : undefined,
      severityLevels: this.filters.severityLevels.length > 0 ? this.filters.severityLevels : undefined,
      ipAddress: this.filters.ipAddress || undefined,
      searchTerm: this.filters.searchTerm || undefined,
      page: 0,
      size: this.itemsPerPage
    };

    this.activityLogService.getActivityLogs(filter).subscribe({
      next: (response: ActivityLogResponse) => {
        // Parse changes for all logs
        response.logs.forEach(log => {
          if (typeof log.changes === 'string') {
            try {
              log.changes = JSON.parse(log.changes);
            } catch (e) {
              log.changes = {};
            }
          }
        });
        this.filteredLogs = response.logs;
        this.paginatedLogs = response.logs;
        this.totalPages = response.totalPages;
    this.currentPage = 1;
        this.isLoading = false;
    
    setTimeout(() => {
      this.initializeIcons();
    }, 50);
      },
      error: (error) => {
        console.error('Error applying filters:', error);
        this.isLoading = false;
      }
    });
  }

  toggleActionType(actionType: string, event: any): void {
    if (event.target.checked) {
      this.filters.actionTypes.push(actionType);
    } else {
      this.filters.actionTypes = this.filters.actionTypes.filter(type => type !== actionType);
    }
    this.applyFilters();
  }

  toggleSeverity(severity: string, event: any): void {
    if (event.target.checked) {
      this.filters.severityLevels.push(severity);
    } else {
      this.filters.severityLevels = this.filters.severityLevels.filter(level => level !== severity);
    }
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.filters = {
      dateFrom: '',
      dateTo: '',
      userId: '',
      actionTypes: [],
      severityLevels: [],
      ipAddress: '',
      searchTerm: ''
    };
    this.selectedDateRange = '';
    this.setDefaultDateRange();
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.filters.userId !== '' ||
           this.filters.actionTypes.length > 0 ||
           this.filters.severityLevels.length > 0 ||
           this.filters.ipAddress !== '' ||
           this.filters.searchTerm !== '';
  }

  // Pagination methods
  updatePagination(): void {
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // View methods
  setViewMode(mode: 'detailed' | 'compact'): void {
    this.viewMode = mode;
    setTimeout(() => {
      this.initializeIcons();
    }, 50);
  }

  viewLogDetails(log: ActivityLog): void {
    this.selectedLog = log;
    setTimeout(() => {
      this.initializeIcons();
    }, 100);
  }

  toggleExportDropdown(): void {
    this.showExportDropdown = !this.showExportDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.showExportDropdown) {
      const exportDropdown = this.elementRef.nativeElement.querySelector('#exportDropdown');
      if (exportDropdown && !exportDropdown.contains(event.target as Node)) {
        this.showExportDropdown = false;
      }
    }
  }

  // Close export dropdown when pressing Escape key
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showExportDropdown) {
      this.showExportDropdown = false;
    }
  }

  closeLogDetails(): void {
    this.selectedLog = null;
  }

  // Utility methods
  get uniqueUsers() {
    const users = this.allLogs
      .filter(log => log.userId != null)
      .map(log => ({
        id: log.userId ? log.userId.toString() : '',
        name: log.userName,
        role: log.userRole
      }));
    return users.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
  }

  get totalLogs(): number {
    return this.statistics.totalLogs;
  }

  get criticalCount(): number {
    return this.statistics.criticalEvents;
  }

  getActionIcon(actionType: string): string {
    const action = this.actionTypes.find(a => a.value === actionType);
    return action ? action.icon : 'activity';
  }

  getActionLabel(actionType: string): string {
    const action = this.actionTypes.find(a => a.value === actionType);
    return action ? action.label : actionType;
  }

  getSeverityIcon(severity: string): string {
    const sev = this.severityLevels.find(s => s.value === severity);
    return sev ? sev.icon : 'alert-circle';
  }

  getLogDetails(details: string): Array<{key: string, value: string}> {
    if (!details) return [];
    
    try {
      const parsed = JSON.parse(details);
      return Object.keys(parsed).map(key => ({
      key: key.charAt(0).toUpperCase() + key.slice(1),
        value: typeof parsed[key] === 'object' ? JSON.stringify(parsed[key]) : parsed[key]
      }));
    } catch (e) {
      return [];
    }
  }

  getLogChanges(changes: any): Array<{field: string, before: any, after: any}> {
    if (!changes) return [];
    try {
      // If already parsed object, use directly
      const parsed = typeof changes === 'string' ? JSON.parse(changes) : changes;
      
      // Handle the new changes structure with before/after
      if (parsed.before && parsed.after) {
        const changes: Array<{field: string, before: any, after: any}> = [];
        const before = parsed.before;
        const after = parsed.after;
        
        // Get all unique fields from both before and after
        const allFields = new Set([...Object.keys(before), ...Object.keys(after)]);
        
        allFields.forEach(field => {
          changes.push({
            field: field.charAt(0).toUpperCase() + field.slice(1),
            before: before[field] || 'N/A',
            after: after[field] || 'N/A'
          });
        });
        
        return changes;
      }
      
      // Handle legacy array format
      if (Array.isArray(parsed)) {
        return parsed.map((change: any) => ({
          field: change.field || change.key || 'Unknown',
          before: change.before || change.oldValue || 'N/A',
          after: change.after || change.newValue || 'N/A'
        }));
      }
      
      return [];
    } catch (e) {
      console.error('Error parsing changes:', e);
      return [];
    }
  }

  copyLogInfo(log: ActivityLog): void {
    const logInfo = `
Timestamp: ${log.timestamp}
User: ${log.userName} (${log.userRole})
Action: ${this.getActionLabel(log.actionType)}
Severity: ${log.severityLevel}
Description: ${log.description}
IP Address: ${log.ipAddress}
    `.trim();

    navigator.clipboard.writeText(logInfo).then(() => {
      alert('Log information copied to clipboard');
    });
  }

  refreshLogs(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.loadActivityLogs();
      this.loadStatistics();
      setTimeout(() => {
        this.initializeIcons();
      }, 100);
    }, 500);
  }

  // Export methods
  exportLogs(format: 'csv' | 'json' | 'pdf'): void {
    // Close the export dropdown
    this.showExportDropdown = false;
    
    // Show loading state
    this.isLoading = true;
    
    const filter: ActivityLogFilter = {
      dateFrom: this.filters.dateFrom,
      dateTo: this.filters.dateTo,
      userId: this.filters.userId ? parseInt(this.filters.userId) : undefined,
      actionTypes: this.filters.actionTypes.length > 0 ? this.filters.actionTypes : undefined,
      severityLevels: this.filters.severityLevels.length > 0 ? this.filters.severityLevels : undefined,
      ipAddress: this.filters.ipAddress || undefined,
      searchTerm: this.filters.searchTerm || undefined
    };

    this.activityLogService.exportActivityLogs(filter, format).subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;
        
        // Check if blob is empty
        if (blob.size === 0) {
          alert('No data available for export. Please check your filters.');
          return;
        }
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        // Show success message
        this.showExportSuccess = true;
        this.exportSuccessMessage = `Activity logs exported successfully as ${format.toUpperCase()}`;
        setTimeout(() => {
          this.showExportSuccess = false;
          this.exportSuccessMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error exporting logs:', error);
        
        // More specific error messages
        if (error.status === 403) {
          alert('You do not have permission to export activity logs.');
        } else if (error.status === 404) {
          alert('Export service not found. Please contact administrator.');
        } else if (error.status === 500) {
          alert('Server error occurred while exporting. Please try again later.');
        } else {
          alert('Error exporting logs. Please try again.');
        }
      }
    });
  }

  trackByLogId(index: number, log: ActivityLog): number {
    return log.id;
  }
}