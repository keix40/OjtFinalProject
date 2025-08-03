import { Component, OnInit, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { ActivityLogService, ActivityLogFilter, ActivityLogResponse, ActivityStatistics } from '../services/activity-log.service';
import { environment } from '../../environments/environment';

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
    // { value: 'VIEW', label: 'View', icon: 'eye' },
    // { value: 'EXPORT', label: 'Export', icon: 'download' },
    // { value: 'IMPORT', label: 'Import', icon: 'upload' },
    // { value: 'SECURITY', label: 'Security', icon: 'shield' },
    // { value: 'SYSTEM', label: 'System', icon: 'settings' }
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
    
    // Auto-refresh logs every 30 seconds to show new activity
    setInterval(() => {
      console.log('Auto-refreshing activity logs...');
      this.loadActivityLogs();
    }, 30000);
  }

  // ngAfterViewInit(): void {
  //   this.initializeIcons();
  // }

  // private initializeIcons(): void {
  //   if (typeof window !== 'undefined' && (window as any).lucide) {
  //     (window as any).lucide.createIcons();
  //   } else if (typeof lucide !== 'undefined') {
  //     lucide.createIcons();
  //   }
    
  //   setTimeout(() => {
  //     if (typeof window !== 'undefined' && (window as any).lucide) {
  //       (window as any).lucide.createIcons();
  //     } else if (typeof lucide !== 'undefined') {
  //       lucide.createIcons();
  //     }
  //   }, 100);
  // }

  loadActivityLogs(): void {
    this.isLoading = true;
    
    // Load all data for client-side filtering (use a large size to get all data)
    const filter: ActivityLogFilter = {
      page: 0,
      size: 1000 // Load more data for client-side filtering
    };

    this.activityLogService.getActivityLogs(filter).subscribe({
      next: (response: ActivityLogResponse) => {
        // Clear cache when new data is loaded
        this.hasActualChangesCache.clear();
        
        console.log('Activity logs loaded:', response.logs.length, 'logs');
        console.log('Entity types found:', [...new Set(response.logs.map(log => log.entityType))]);
        
        // Parse changes for all logs
        response.logs.forEach(log => {
          if (typeof log.changes === 'string') {
            try {
              log.changes = JSON.parse(log.changes);
            } catch (e) {
              log.changes = {};
            }
          }
          
          // Debug: Log specific entity types we're looking for
          if (['RETURN_REQUEST', 'REVIEW', 'EVENT', 'BLACKLIST', 'VIP_TIER', 'WISHLIST'].includes(log.entityType)) {
            console.log(`Found ${log.entityType} log:`, {
              id: log.id,
              actionType: log.actionType,
              description: log.description,
              changes: log.changes,
              timestamp: log.timestamp
            });
          }
        });
        
        // Store all logs for client-side filtering
        this.allLogs = response.logs;
        
        // Apply initial filters
        this.applyFilters();
        
        // Update totalLogs from backend response if available
        if (typeof response.totalElements === 'number') {
          this.statistics.totalLogs = response.totalElements;
        } else if (Array.isArray(response.totalElements)) {
          // Handle case where backend returns array instead of number
          this.statistics.totalLogs = response.totalElements[0] || 0;
        } else if (typeof response.totalElements === 'string') {
          // Handle case where backend returns string
          const parsed = parseInt(response.totalElements, 10);
          this.statistics.totalLogs = isNaN(parsed) ? 0 : parsed;
        }
        
        this.isLoading = false;
        
      // setTimeout(() => {
      //   this.initializeIcons();
      // }, 100);
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
        console.log('Statistics received from backend:', stats);
        // Ensure totalLogs is a number
        if (typeof stats.totalLogs === 'string') {
          const parsed = parseInt(stats.totalLogs, 10);
          stats.totalLogs = isNaN(parsed) ? 0 : parsed;
        } else if (Array.isArray(stats.totalLogs)) {
          stats.totalLogs = stats.totalLogs[0] || 0;
        }
        this.statistics = stats;
        console.log('Processed statistics:', this.statistics);
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
    }
    });
  }

  setDefaultDateRange(): void {
    const today = new Date();
    
    // Set default to "Today" to show recent activity
    this.filters.dateFrom = today.toISOString().split('T')[0];
    this.filters.dateTo = today.toISOString().split('T')[0];
    this.selectedDateRange = 'today';
    
    console.log('Default date range set to TODAY:', this.filters.dateFrom, 'to', this.filters.dateTo);
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
      case 'all':
        this.filters.dateFrom = '';
        this.filters.dateTo = '';
        break;
    }
    
    console.log('Date range selected:', range, 'Filters:', this.filters.dateFrom, 'to', this.filters.dateTo);
    this.applyFilters();
  }

  applyFilters(): void {
    this.isLoading = true;
    
    console.log('Starting filter application...');
    
    // Apply client-side filtering to the already loaded data
    let filtered = [...this.allLogs];
    
    console.log('Applying filters to', filtered.length, 'logs');
    console.log('Current filters:', this.filters);
    
    // Date range filter
    if (this.filters.dateFrom || this.filters.dateTo) {
      const beforeDateFilter = filtered.length;
      
      // Debug: Show some log timestamps and filter dates
      console.log('Date filter debug:');
      console.log('Filter from:', this.filters.dateFrom);
      console.log('Filter to:', this.filters.dateTo);
      
      // Show first few log timestamps for debugging
      filtered.slice(0, 3).forEach((log, index) => {
        const logDate = new Date(log.timestamp);
        console.log(`Log ${index + 1} timestamp:`, log.timestamp, 'Parsed date:', logDate);
      });
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
        const toDate = this.filters.dateTo ? new Date(this.filters.dateTo + 'T23:59:59') : null;
        
        // Debug specific logs that might be filtered out
        if (['BLACKLIST', 'EVENT', 'VIP_TIER'].includes(log.entityType)) {
          console.log(`Checking ${log.entityType} log:`, {
            logTimestamp: log.timestamp,
            logDate: logDate,
            fromDate: fromDate,
            toDate: toDate,
            isBeforeFrom: fromDate && logDate < fromDate,
            isAfterTo: toDate && logDate > toDate
          });
        }
        
        if (fromDate && logDate < fromDate) return false;
        if (toDate && logDate > toDate) return false;
        return true;
      });
      console.log('Date filter: removed', beforeDateFilter - filtered.length, 'logs');
    }
    
    // User ID filter
    if (this.filters.userId) {
      const beforeUserIdFilter = filtered.length;
      filtered = filtered.filter(log => log.userId.toString() === this.filters.userId);
      console.log('User ID filter: removed', beforeUserIdFilter - filtered.length, 'logs');
    }
    
    // Action types filter
    if (this.filters.actionTypes.length > 0) {
      const beforeActionFilter = filtered.length;
      filtered = filtered.filter(log => this.filters.actionTypes.includes(log.actionType));
      console.log('Action types filter: removed', beforeActionFilter - filtered.length, 'logs');
    }
    
    // Severity levels filter
    if (this.filters.severityLevels.length > 0) {
      const beforeSeverityFilter = filtered.length;
      filtered = filtered.filter(log => this.filters.severityLevels.includes(log.severityLevel));
      console.log('Severity levels filter: removed', beforeSeverityFilter - filtered.length, 'logs');
    }
    
    // IP address filter
    if (this.filters.ipAddress) {
      const beforeIpFilter = filtered.length;
      filtered = filtered.filter(log => 
        log.ipAddress.toLowerCase().includes(this.filters.ipAddress.toLowerCase())
      );
      console.log('IP address filter: removed', beforeIpFilter - filtered.length, 'logs');
    }
    
    // Search term filter
    if (this.filters.searchTerm) {
      const beforeSearchFilter = filtered.length;
      const searchTerm = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(searchTerm) ||
        log.userName.toLowerCase().includes(searchTerm) ||
        log.entityType.toLowerCase().includes(searchTerm) ||
        log.entityId.toLowerCase().includes(searchTerm)
      );
      console.log('Search term filter: removed', beforeSearchFilter - filtered.length, 'logs');
    }
    
    // Debug: Check for new entity types in filtered results
    const newEntityTypes = ['RETURN_REQUEST', 'REVIEW', 'EVENT', 'BLACKLIST', 'VIP_TIER', 'WISHLIST'];
    newEntityTypes.forEach(entityType => {
      const count = filtered.filter(log => log.entityType === entityType).length;
      if (count > 0) {
        console.log(`Found ${count} ${entityType} logs in filtered results`);
      }
    });
    
    // Update filtered logs
    this.filteredLogs = filtered;
    
    // Update pagination
    this.totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
    this.currentPage = 1;
    
    // Update paginated logs
    this.updatePaginatedLogs();
    
    console.log('Final filtered logs:', this.filteredLogs.length);
    console.log('Paginated logs:', this.paginatedLogs.length);
    console.log('Filter application completed');
    
    this.isLoading = false;
    
    // setTimeout(() => {
    //   this.initializeIcons();
    // }, 50);
  }

  private updatePaginatedLogs(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedLogs = this.filteredLogs.slice(startIndex, endIndex);
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
    this.updatePaginatedLogs();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedLogs();
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
    // setTimeout(() => {
    //   this.initializeIcons();
    // }, 50);
  }

  viewLogDetails(log: ActivityLog): void {
    this.selectedLog = log;
    // setTimeout(() => {
    //   this.initializeIcons();
    // }, 100);
  }

  toggleExportDropdown(): void {
    console.log('Toggle export dropdown:', {
      currentState: this.showExportDropdown,
      newState: !this.showExportDropdown,
      isLoading: this.isLoading,
      filteredLogsCount: this.filteredLogs.length
    });
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
          // Use proper null/undefined checks instead of || operator
          const beforeValue = before.hasOwnProperty(field) ? before[field] : 'N/A';
          const afterValue = after.hasOwnProperty(field) ? after[field] : 'N/A';
          
          changes.push({
            field: field.charAt(0).toUpperCase() + field.slice(1),
            before: beforeValue,
            after: afterValue
          });
        });
        
        return changes;
      }
      
      // Handle legacy array format
      if (Array.isArray(parsed)) {
        return parsed.map((change: any) => ({
          field: change.field || change.key || 'Unknown',
          before: change.before !== undefined ? change.before : (change.oldValue !== undefined ? change.oldValue : 'N/A'),
          after: change.after !== undefined ? change.after : (change.newValue !== undefined ? change.newValue : 'N/A')
        }));
      }
      
      // Handle case where changes might be a simple object with field names as keys
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const changes: Array<{field: string, before: any, after: any}> = [];
        Object.keys(parsed).forEach(field => {
          const value = parsed[field];
          if (typeof value === 'object' && value !== null && (value.before !== undefined || value.after !== undefined)) {
            changes.push({
              field: field.charAt(0).toUpperCase() + field.slice(1),
              before: value.before !== undefined ? value.before : 'N/A',
              after: value.after !== undefined ? value.after : 'N/A'
            });
          }
        });
        return changes;
      }
      
      return [];
    } catch (e) {
      console.error('Error parsing changes:', e);
      return [];
    }
  }

  // Helper method to format change values for display
  formatChangeValue(value: any): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (value === '') {
      return '(empty)';
    }
    if (Array.isArray(value)) {
      // Special handling for category arrays
      if (value.length === 0) {
        return 'No categories';
      }
      if (value.length === 1 && value[0] === 'No categories') {
        return '<span class="font-bold text-gray-600">No categories</span>';
      }
      // Format category names with whole name in bold
      return value.map((category: string) => {
        if (category === 'No categories') {
          return '<span class="font-bold text-gray-600">No categories</span>';
        }
        return `<span class="font-bold">${category}</span>`;
      }).join(' , ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    // Check if the value is an image URL
    const stringValue = String(value);
    if (this.isImageUrlPrivate(stringValue)) {
      return this.formatImageDisplay(stringValue);
    }
    
    return stringValue;
  }



  // Helper method to format image display
  private formatImageDisplay(imageUrl: string): string {
    // Extract base URL from environment (remove /api suffix)
    const baseUrl = environment.apiUrl.replace('/api', '');
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
    
    return `
      <div class="flex items-center space-x-2">
        <img src="${fullUrl}" 
             alt="Image" 
             class="w-12 h-12 object-cover rounded border border-gray-300 shadow-sm cursor-pointer"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"
             loading="lazy"
             title="Click to view full size">
        <span class="text-xs text-gray-500" style="display: none;">${imageUrl}</span>
      </div>
    `;
  }

  // Method to check if a value is an image URL (public for template use)
  isImageUrl(value: any): boolean {
    if (typeof value !== 'string') return false;
    return this.isImageUrlPrivate(value);
  }

  // Private method for image URL detection
  private isImageUrlPrivate(value: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
    const imagePatterns = [
      /\/brand_and_category_image\//,
      /\/product_image\//,
      /\/review\//,
      /\/uploads\//,
      /\/event\//,
      /\/return_images\//
    ];
    
    // Check if it's a file path with image extension
    const hasImageExtension = imageExtensions.some(ext => 
      value.toLowerCase().includes(ext) && 
      (value.includes('/') || value.includes('\\'))
    );
    
    // Check if it matches known image patterns
    const matchesImagePattern = imagePatterns.some(pattern => pattern.test(value));
    
    // Check if it's a data URL (base64 image)
    const isDataUrl = value.startsWith('data:image/');
    
    return hasImageExtension || matchesImagePattern || isDataUrl;
  }

  // Method to get full image URL
  getImageUrl(value: string): string {
    const baseUrl = environment.apiUrl.replace('/api', '');
    return value.startsWith('http') ? value : `${baseUrl}${value}`;
  }

  // Method to open image in new tab
  openImageInNewTab(imageUrl: string): void {
    const baseUrl = environment.apiUrl.replace('/api', '');
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
    window.open(fullUrl, '_blank');
  }

  // Helper method to format description with proper styling for different operations
  formatDescription(description: string, actionType: string): string {
    if (description.includes('**')) {
      switch (actionType) {
        case 'CREATE':
          // For CREATE operations, format the bold text in green
          return description.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-green-600">$1</span>');
        case 'UPDATE':
          // For UPDATE operations, format the bold text in light blue
          return description.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-blue-500">$1</span>');
        case 'DELETE':
          // For DELETE operations, format the bold text in red
          return description.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-red-600">$1</span>');
        default:
          // For other operations, format the bold text in default color
          return description.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold">$1</span>');
      }
    }
    return description;
  }

  // Cache for hasActualChanges results to prevent excessive method calls
  private hasActualChangesCache = new Map<string, boolean>();

  // Helper method to check if there are actual changes to display
  hasActualChanges(changes: any): boolean {
    if (!changes) return false;
    
    // Create a cache key based on the changes object
    const cacheKey = typeof changes === 'string' ? changes : JSON.stringify(changes);
    
    // Check if we have a cached result
    if (this.hasActualChangesCache.has(cacheKey)) {
      return this.hasActualChangesCache.get(cacheKey)!;
    }
    
    // Use getLogChanges to properly parse and check for actual changes
    const parsedChanges = this.getLogChanges(changes);
    const hasChanges = parsedChanges.length > 0;
    
    // Cache the result
    this.hasActualChangesCache.set(cacheKey, hasChanges);
    return hasChanges;
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
    console.log('Refreshing activity logs...');
    this.isLoading = true;
    
    // Clear any cached data
    this.allLogs = [];
    this.filteredLogs = [];
    this.paginatedLogs = [];
    this.hasActualChangesCache.clear();
    
    // Reset filters to show all logs
    this.filters = {
      dateFrom: '',
      dateTo: '',
      userId: '',
      actionTypes: [],
      severityLevels: [],
      ipAddress: '',
      searchTerm: ''
    };
    
    setTimeout(() => {
      this.loadActivityLogs();
      this.loadStatistics();
      // setTimeout(() => {
      //   this.initializeIcons();
      // }, 100);
    }, 500);
  }

  // Export methods - Client-side export (no backend dependency)
  exportLogs(format: 'csv' | 'json' | 'pdf'): void {
    // Close the export dropdown
    this.showExportDropdown = false;
    
    // Show loading state
    this.isLoading = true;
    
    // Use the current filtered logs for export
    const logsToExport = this.filteredLogs;
    
    console.log('Export requested:', {
      format: format,
      totalLogs: this.allLogs.length,
      filteredLogs: this.filteredLogs.length,
      logsToExport: logsToExport.length,
      currentFilters: this.filters,
      selectedDateRange: this.selectedDateRange
    });
    
    if (logsToExport.length === 0) {
        this.isLoading = false;
        console.warn('No logs to export - filtered logs is empty');
        alert('No data available for export. Please check your filters.');
        return;
        }
        
    try {
      let content: string;
      let filename: string;
      let mimeType: string;
      
      switch (format) {
        case 'csv':
          content = this.generateCSV(logsToExport);
          filename = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          content = this.generateJSON(logsToExport);
          filename = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        case 'pdf':
          // For PDF, we'll create a simple text-based PDF-like format
          content = this.generatePDF(logsToExport);
          filename = `activity-logs-${new Date().toISOString().split('T')[0]}.txt`;
          mimeType = 'text/plain';
          break;
        default:
          throw new Error('Unsupported export format');
      }
      
      // Create and download the file
      const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
      link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        
        // Show success message
        this.showExportSuccess = true;
        this.exportSuccessMessage = `Activity logs exported successfully as ${format.toUpperCase()}`;
        setTimeout(() => {
          this.showExportSuccess = false;
          this.exportSuccessMessage = '';
        }, 3000);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting logs. Please try again.');
    } finally {
        this.isLoading = false;
    }
  }

  private generateCSV(logs: ActivityLog[]): string {
    const headers = [
      'ID', 'Timestamp', 'User Name', 'User Role', 'Action Type', 'Entity Type', 
      'Entity ID', 'Description', 'Severity Level', 'IP Address', 'User Agent', 
      'Session ID', 'Status', 'Error Message'
    ];
    
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.userName,
      log.userRole,
      log.actionType,
      log.entityType,
      log.entityId,
      log.description,
      log.severityLevel,
      log.ipAddress,
      log.userAgent,
      log.sessionId,
      log.status,
      log.errorMessage
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field || ''}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  private generateJSON(logs: ActivityLog[]): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalRecords: logs.length,
      filters: this.filters,
      logs: logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        userName: log.userName,
        userRole: log.userRole,
        actionType: log.actionType,
        entityType: log.entityType,
        entityId: log.entityId,
        description: log.description,
        severityLevel: log.severityLevel,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        sessionId: log.sessionId,
        status: log.status,
        errorMessage: log.errorMessage,
        details: log.details,
        changes: log.changes
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  private generatePDF(logs: ActivityLog[]): string {
    let content = 'ACTIVITY LOGS REPORT\n';
    content += '='.repeat(50) + '\n\n';
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Total Records: ${logs.length}\n`;
    content += `Filters Applied: ${this.hasActiveFilters() ? 'Yes' : 'No'}\n\n`;
    
    logs.forEach((log, index) => {
      content += `Record ${index + 1}:\n`;
      content += `- ID: ${log.id}\n`;
      content += `- Timestamp: ${log.timestamp}\n`;
      content += `- User: ${log.userName} (${log.userRole})\n`;
      content += `- Action: ${log.actionType}\n`;
      content += `- Entity: ${log.entityType} (${log.entityId})\n`;
      content += `- Description: ${log.description}\n`;
      content += `- Severity: ${log.severityLevel}\n`;
      content += `- IP Address: ${log.ipAddress}\n`;
      content += `- Status: ${log.status}\n`;
      if (log.errorMessage) {
        content += `- Error: ${log.errorMessage}\n`;
      }
      content += '\n';
    });
    
    return content;
  }

  trackByLogId(index: number, log: ActivityLog): number {
    return log.id;
  }

  trackByChangeField(index: number, change: any): string {
    return change.field;
  }

  trackByLogDetail(index: number, detail: any): string {
    return detail.key;
  }
}