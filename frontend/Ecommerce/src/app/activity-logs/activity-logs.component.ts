import { Component, OnInit } from '@angular/core';

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
export class ActivityLogsComponent implements OnInit {
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
    { value: 'login', label: 'Login', icon: 'fas fa-sign-in-alt' },
    { value: 'logout', label: 'Logout', icon: 'fas fa-sign-out-alt' },
    { value: 'create', label: 'Create', icon: 'fas fa-plus' },
    { value: 'update', label: 'Update', icon: 'fas fa-edit' },
    { value: 'delete', label: 'Delete', icon: 'fas fa-trash' },
    { value: 'view', label: 'View', icon: 'fas fa-eye' },
    { value: 'export', label: 'Export', icon: 'fas fa-download' },
    { value: 'import', label: 'Import', icon: 'fas fa-upload' },
    { value: 'security', label: 'Security', icon: 'fas fa-shield-alt' },
    { value: 'system', label: 'System', icon: 'fas fa-cog' }
  ];

  severityLevels = [
    { value: 'low', label: 'Low', icon: 'fas fa-info-circle' },
    { value: 'medium', label: 'Medium', icon: 'fas fa-exclamation-triangle' },
    { value: 'high', label: 'High', icon: 'fas fa-exclamation-circle' },
    { value: 'critical', label: 'Critical', icon: 'fas fa-times-circle' }
  ];

  ngOnInit(): void {
    this.loadActivityLogs();
    this.setDefaultDateRange();
  }

  loadActivityLogs(): void {
    this.isLoading = true;
    
    // Mock data - replace with actual API call
    setTimeout(() => {
      this.allLogs = this.generateMockLogs();
      this.applyFilters();
      this.isLoading = false;
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
      // Date filter
      if (this.filters.dateFrom) {
        const fromDate = new Date(this.filters.dateFrom);
        if (log.timestamp < fromDate) return false;
      }
      
      if (this.filters.dateTo) {
        const toDate = new Date(this.filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (log.timestamp > toDate) return false;
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

      // Search term filter
      if (this.filters.searchTerm) {
        const searchTerm = this.filters.searchTerm.toLowerCase();
        return log.description.toLowerCase().includes(searchTerm) ||
               log.user.name.toLowerCase().includes(searchTerm) ||
               log.actionType.toLowerCase().includes(searchTerm);
      }

      return true;
    });

    this.currentPage = 1;
    this.updatePagination();
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
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedLogs = this.filteredLogs.slice(startIndex, endIndex);
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
  }

  viewLogDetails(log: ActivityLog): void {
    this.selectedLog = log;
    // Modal would be triggered via Bootstrap JS or Angular CDK
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
    return action ? action.icon : 'fas fa-question';
  }

  getActionLabel(actionType: string): string {
    const action = this.actionTypes.find(a => a.value === actionType);
    return action ? action.label : actionType;
  }

  getSeverityIcon(severity: string): string {
    const sev = this.severityLevels.find(s => s.value === severity);
    return sev ? sev.icon : 'fas fa-info';
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
    this.loadActivityLogs();
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