import { Component, OnInit, AfterViewInit } from '@angular/core';

declare var lucide: any;

interface ActivityLog {
  id: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    role: string;
  };
  actionType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  details?: any;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}

interface LogFilters {
  dateFrom: string;
  dateTo: string;
  userId: string;
  actionTypes: string[];
  severityLevels: string[];
  ipAddress: string;
  searchTerm: string;
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

  // Pagination
  currentPage = 1;
  itemsPerPage = 25;
  totalPages = 1;

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
    { value: 'login', label: 'Login', icon: 'log-in' },
    { value: 'logout', label: 'Logout', icon: 'log-out' },
    { value: 'create', label: 'Create', icon: 'plus' },
    { value: 'update', label: 'Update', icon: 'edit-3' },
    { value: 'delete', label: 'Delete', icon: 'trash-2' },
    { value: 'view', label: 'View', icon: 'eye' },
    { value: 'export', label: 'Export', icon: 'download' },
    { value: 'import', label: 'Import', icon: 'upload' },
    { value: 'security', label: 'Security', icon: 'shield' },
    { value: 'system', label: 'System', icon: 'settings' }
  ];

  severityLevels = [
    { value: 'low', label: 'Low', icon: 'info' },
    { value: 'medium', label: 'Medium', icon: 'alert-triangle' },
    { value: 'high', label: 'High', icon: 'alert-circle' },
    { value: 'critical', label: 'Critical', icon: 'x-circle' }
  ];

  ngOnInit(): void {
    this.loadActivityLogs();
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
    
    // Re-initialize icons after a short delay to ensure DOM is ready
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
    
    // Mock data - replace with actual API call
    setTimeout(() => {
      this.allLogs = this.generateMockLogs();
      this.applyFilters();
      this.isLoading = false;
      
      // Re-initialize icons after data loads
      setTimeout(() => {
        this.initializeIcons();
      }, 100);
    }, 1000);
  }

  generateMockLogs(): ActivityLog[] {
    const users = [
      { id: '1', name: 'John Admin', role: 'Administrator' },
      { id: '2', name: 'Sarah Manager', role: 'Manager' },
      { id: '3', name: 'Mike Staff', role: 'Staff' },
      { id: '4', name: 'Lisa Support', role: 'Support' },
      { id: '5', name: 'David Customer', role: 'Customer' }
    ];

    const actions = [
      { type: 'login', description: 'User logged into the system', severity: 'low' },
      { type: 'logout', description: 'User logged out of the system', severity: 'low' },
      { type: 'create', description: 'Created new product "Wireless Headphones"', severity: 'medium' },
      { type: 'update', description: 'Updated customer profile for John Doe', severity: 'medium' },
      { type: 'delete', description: 'Deleted order #12345', severity: 'high' },
      { type: 'export', description: 'Exported customer data to CSV', severity: 'medium' },
      { type: 'security', description: 'Failed login attempt detected', severity: 'critical' },
      { type: 'system', description: 'System backup completed successfully', severity: 'low' }
    ];

    const logs: ActivityLog[] = [];
    const now = new Date();

    for (let i = 0; i < 150; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);

      logs.push({
        id: `LOG${String(i + 1).padStart(4, '0')}`,
        timestamp,
        user,
        actionType: action.type,
        severity: action.severity as any,
        description: action.description,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: {
          sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
          duration: Math.floor(Math.random() * 3600),
          location: 'New York, US'
        },
        changes: action.type === 'update' ? [
          {
            field: 'email',
            oldValue: 'old@example.com',
            newValue: 'new@example.com'
          },
          {
            field: 'status',
            oldValue: 'inactive',
            newValue: 'active'
          }
        ] : undefined
      });
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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
    this.filteredLogs = this.allLogs.filter(log => {
      // Date range filter
      if (this.filters.dateFrom && log.timestamp < new Date(this.filters.dateFrom)) {
        return false;
      }
      if (this.filters.dateTo && log.timestamp > new Date(this.filters.dateTo + 'T23:59:59')) {
        return false;
      }

      // User filter
      if (this.filters.userId && log.user.id !== this.filters.userId) {
        return false;
      }

      // Action type filter
      if (this.filters.actionTypes.length > 0 && !this.filters.actionTypes.includes(log.actionType)) {
        return false;
      }

      // Severity filter
      if (this.filters.severityLevels.length > 0 && !this.filters.severityLevels.includes(log.severity)) {
        return false;
      }

      // IP address filter
      if (this.filters.ipAddress && !log.ipAddress.includes(this.filters.ipAddress)) {
        return false;
      }

      // Search filter
      if (this.filters.searchTerm && !log.description.toLowerCase().includes(this.filters.searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });

    this.currentPage = 1;
    this.updatePagination();
    
    // Re-initialize icons after filtering
    setTimeout(() => {
      this.initializeIcons();
    }, 50);
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
    this.totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.paginatedLogs = this.filteredLogs.slice(
      (this.currentPage - 1) * this.itemsPerPage,
      this.currentPage * this.itemsPerPage
    );
    
    // Re-initialize icons after pagination
    setTimeout(() => {
      this.initializeIcons();
    }, 50);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
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
    // Re-initialize icons when view mode changes
    setTimeout(() => {
      this.initializeIcons();
    }, 50);
  }

  viewLogDetails(log: ActivityLog): void {
    this.selectedLog = log;
    // Re-initialize icons when modal opens
    setTimeout(() => {
      this.initializeIcons();
    }, 100);
  }

  toggleExportDropdown(): void {
    this.showExportDropdown = !this.showExportDropdown;
  }

  closeLogDetails(): void {
    this.selectedLog = null;
  }

  // Utility methods
  get uniqueUsers() {
    const users = this.allLogs.map(log => log.user);
    return users.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
  }

  get totalLogs(): number {
    return this.allLogs.length;
  }

  get criticalCount(): number {
    return this.allLogs.filter(log => log.severity === 'critical').length;
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

  getLogDetails(details: any): Array<{key: string, value: string}> {
    if (!details) return [];
    
    return Object.keys(details).map(key => ({
      key: key.charAt(0).toUpperCase() + key.slice(1),
      value: typeof details[key] === 'object' ? JSON.stringify(details[key]) : details[key]
    }));
  }

  copyLogInfo(log: ActivityLog): void {
    const logInfo = `
Timestamp: ${log.timestamp.toISOString()}
User: ${log.user.name} (${log.user.role})
Action: ${this.getActionLabel(log.actionType)}
Severity: ${log.severity}
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
      // Re-initialize icons after refresh
      setTimeout(() => {
        this.initializeIcons();
      }, 100);
    }, 500);
  }

  // Export methods
  exportLogs(format: 'csv' | 'json' | 'pdf'): void {
    switch (format) {
      case 'csv':
        this.exportToCsv();
        break;
      case 'json':
        this.exportToJson();
        break;
      case 'pdf':
        this.exportToPdf();
        break;
    }
  }

  private exportToCsv(): void {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Severity', 'Description', 'IP Address'];
    const rows = this.filteredLogs.map(log => [
      log.timestamp.toISOString(),
      log.user.name,
      log.user.role,
      this.getActionLabel(log.actionType),
      log.severity,
      log.description,
      log.ipAddress
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private exportToJson(): void {
    const jsonContent = JSON.stringify(this.filteredLogs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private exportToPdf(): void {
    // This would typically use a PDF library like jsPDF
    alert('PDF export functionality would be implemented with a PDF library like jsPDF');
  }

  trackByLogId(index: number, log: ActivityLog): string {
    return log.id;
  }
}