import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { interval, type Subscription } from "rxjs"
import { LoginAttemptsService, LoginAttempt } from '../services/login-attempts.service';
import { HttpClient } from '@angular/common/http';
import { NotifcationService } from '../notifcation.service';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';

interface ActivityFeedItem {
  id: string
  timestamp: string
  type: "success" | "warning" | "danger"
  message: string
}

interface Statistics {
  successfulLogins: number
  failedLogins: number
  blockedIPs: number
  lockedAccounts: number
  successfulLoginsChange: number
  failedLoginsChange: number
  blockedIPsChange: number
  lockedAccountsChange: number
}

@Component({
  selector: "app-login-attempts",
  standalone: false,
  templateUrl: "./login-attempts.component.html",
  styleUrls: ["./login-attempts.component.css"],
})
export class LoginAttemptsComponent implements OnInit, OnDestroy {

  // Data properties
  loginAttempts: LoginAttempt[] = []
  filteredAttempts: LoginAttempt[] = []
  paginatedAttempts: LoginAttempt[] = []
  selectedAttempts: LoginAttempt[] = []
  selectedAttemptDetails: LoginAttempt | null = null
  realtimeActivities: ActivityFeedItem[] = []
  criticalAlerts: string[] = []
  securityPolicy: any[] = [];
  showPolicyExpanded: boolean = false;

  // Dual view state
  viewMode: 'summary' | 'detailed' = 'summary';
  summaryAttempts: any[] = [];

  // Statistics
  statistics: Statistics = {
    successfulLogins: 0,
    failedLogins: 0,
    blockedIPs: 0,
    lockedAccounts: 0,
    successfulLoginsChange: 0,
    failedLoginsChange: 0,
    blockedIPsChange: 0,
    lockedAccountsChange: 0,
  }

  // Filter and search properties
  selectedTimeRange = "24h"
  selectedStatus = "all"
  searchTerm = ""
  sortField = "timestamp"
  sortDirection: "asc" | "desc" = "desc"
  
  // Custom date range properties
  customDateFrom = ""
  customDateTo = ""

  // Pagination properties
  currentPage = 1
  itemsPerPage = 20
  totalPages = 1

  // UI state properties
  isRealTimeActive = true;
  intervalId: any;
  isLoading = false

  // Add state for session activity modal
  sessionActivityAttempts: LoginAttempt[] = [];
  showSessionActivityModal: boolean = false;
  sessionActivitySessionId: string | null = null;

  // Modal state for per-row detailed log
  showDetailedLogModal: boolean = false;
  detailedLogContext: LoginAttempt | null = null;
  filteredDetailedLog: LoginAttempt[] = [];

  // Ban confirmation modal state
  showBanConfirmationModal: boolean = false;
  banConfirmationData: { ip: string; username: string; success: boolean; message: string; action: 'ban' | 'whitelist' } | null = null;

  // Subscriptions
  private realTimeSubscription?: Subscription

  // Country flags mapping
  private countryFlags: { [key: string]: string } = {
    US: "🇺🇸",
    RU: "🇷🇺",
    CN: "🇨🇳",
    DE: "🇩🇪",
    GB: "🇬🇧",
    FR: "🇫🇷",
    JP: "🇯🇵",
    KR: "🇰🇷",
    IN: "🇮🇳",
    BR: "🇧🇷",
    CA: "🇨🇦",
    AU: "🇦🇺",
    IT: "🇮🇹",
    ES: "🇪🇸",
    NL: "🇳🇱",
  }

  editingRuleId: number | null = null;
  editedRule: any = {};
  isSavingRule: boolean = false;
  isDeletingRule: boolean = false;
  saveRule(rule: any) {
    this.isSavingRule = true;
    this.http.put<any>(`http://localhost:8080/api/login-attempts/security-policy/${rule.id}`, rule).subscribe({
      next: (data) => {
        this.isSavingRule = false;
        this.editingRuleId = null;
        this.fetchSecurityPolicy();
      },
      error: (err) => {
        this.isSavingRule = false;
        alert('Failed to save rule.');
      }
    });
  }
  editRule(rule: any) {
    this.editingRuleId = rule.id;
    this.editedRule = { ...rule };
  }
  cancelEdit() {
    this.editingRuleId = null;
    this.editedRule = {};
  }
  async deleteRule(rule: any) {
    const ok = await this.luxDialog.confirm({ title: 'Delete this rule?', confirmText: 'Delete', destructive: true });
    if (!ok) return;
    this.isDeletingRule = true;
    this.http.delete<any>(`http://localhost:8080/api/login-attempts/security-policy/${rule.id}`).subscribe({
      next: () => {
        this.isDeletingRule = false;
        this.fetchSecurityPolicy();
      },
      error: (err) => {
        this.isDeletingRule = false;
        alert('Failed to delete rule.');
      }
    });
  }

  constructor(private loginAttemptsService: LoginAttemptsService, private http: HttpClient, private notificationService: NotifcationService, private luxDialog: LuxDialogService) {}

  ngOnInit(): void {
    this.loadLoginAttempts();
    this.startPolling();
    this.checkForCriticalAlerts();
    this.fetchSecurityPolicy();
    // Subscribe to real-time activity feed events
    this.notificationService.notifications$.subscribe((event: any) => {
      if (event && event.type && event.message && event.timestamp) {
        this.realtimeActivities.unshift({
          id: this.generateId(),
          timestamp: event.timestamp,
          type: event.type,
          message: event.message,
        });
        if (this.realtimeActivities.length > 20) {
          this.realtimeActivities = this.realtimeActivities.slice(0, 20);
        }
      }
    });
  }

  loadLoginAttempts(): void {
    this.isLoading = true;
    this.loginAttemptsService.getAll().subscribe({
      next: (data) => {
        this.loginAttempts = data;
        this.calculateStatistics();
        this.applyFilters();
        this.buildSummaryView();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load login attempts:', err);
        this.isLoading = false;
      }
    });
  }

  buildSummaryView(): void {
    // Use filtered attempts for summary view
    const dataToUse = this.filteredAttempts.length > 0 ? this.filteredAttempts : this.loginAttempts;
    
    // Group by username, IP, location, and session (15-minute windows)
    const sessionMap = new Map<string, { count: number, first: LoginAttempt, last: LoginAttempt, sessionId: string }>();
    
    for (const attempt of dataToUse) {
      const baseKey = `${attempt.username}|${attempt.ipAddress}|${attempt.location}`;
      const attemptTime = new Date(attempt.timestamp);
      
      // Check if this attempt belongs to an existing session (within 15 minutes of last attempt)
      let sessionFound = false;
      for (const [key, session] of sessionMap.entries()) {
        if (key.startsWith(baseKey)) {
          const lastAttemptTime = new Date(session.last.timestamp);
          const timeDiff = Math.abs(attemptTime.getTime() - lastAttemptTime.getTime()) / (1000 * 60); // minutes
          
          if (timeDiff <= 15) {
            // Add to existing session
            session.count += 1;
            session.last = attempt;
            sessionFound = true;
            break;
          }
        }
      }
      
      if (!sessionFound) {
        // Create new session
        const sessionId = `${baseKey}|${attemptTime.getTime()}`;
        sessionMap.set(sessionId, {
          count: 1,
          first: attempt,
          last: attempt,
          sessionId: sessionId
        });
      }
    }
    
    this.summaryAttempts = Array.from(sessionMap.values()).map(({ count, first, last, sessionId }) => {
      // Calculate timeframe for this session
      const firstTime = new Date(first.timestamp);
      const lastTime = new Date(last.timestamp);
      const timeDiff = Math.round((Math.abs(lastTime.getTime() - firstTime.getTime()) / (1000 * 60)) * 10) / 10; // minutes, 1 decimal
      
      return {
        ...last,
        attemptCount: count,
        sessionId: sessionId,
        sessionStart: first.timestamp,
        sessionEnd: last.timestamp,
        timeframe: count > 1 ? `${Number.isInteger(timeDiff) ? timeDiff : timeDiff.toFixed(1)} min` : '1 min'
      };
    });
  }

  setViewMode(mode: 'summary' | 'detailed') {
    this.viewMode = mode;
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.realTimeSubscription) {
      this.realTimeSubscription.unsubscribe();
    }
  }

  startPolling(): void {
    this.intervalId = setInterval(() => {
      this.refreshData();
    }, 5000);
  }

  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  toggleRealTimeMonitoring(): void {
    this.isRealTimeActive = !this.isRealTimeActive;
    if (this.isRealTimeActive) {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  // Filtering and searching
  applyFilters(): void {
    let filtered = [...this.loginAttempts]

    // Time range filter
    const now = new Date()
    let timeLimit: Date
    let timeUpperLimit: Date | null = null

    switch (this.selectedTimeRange) {
      case "1h":
        timeLimit = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case "24h":
        timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "7d":
        timeLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        timeLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "custom":
        if (this.customDateFrom && this.customDateTo) {
          timeLimit = new Date(this.customDateFrom)
          timeUpperLimit = new Date(this.customDateTo)
        } else {
          timeLimit = new Date(0)
        }
        break
      default:
        timeLimit = new Date(0)
    }

    // Apply time filter
    filtered = filtered.filter((attempt) => {
      const attemptDate = new Date(attempt.timestamp)
      const isAfterLowerLimit = attemptDate >= timeLimit
      const isBeforeUpperLimit = timeUpperLimit ? attemptDate <= timeUpperLimit : true
      return isAfterLowerLimit && isBeforeUpperLimit
    })

    // Status filter
    if (this.selectedStatus !== "all") {
      if (this.selectedStatus === "suspicious") {
        filtered = filtered.filter((attempt) => attempt.threatLevel === "high" || attempt.threatLevel === "critical")
      } else {
        filtered = filtered.filter((attempt) => attempt.status === this.selectedStatus)
      }
    }

    // Search filter (add sessionId)
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.username.toLowerCase().includes(term) ||
          a.ipAddress.toLowerCase().includes(term) ||
          (a.location && a.location.toLowerCase().includes(term)) ||
          (a.sessionId && a.sessionId.toLowerCase().includes(term))
      );
    }

    this.filteredAttempts = filtered
    this.totalPages = Math.ceil(this.filteredAttempts.length / this.itemsPerPage)
    this.currentPage = 1
    this.updatePaginatedAttempts()
    
    // Rebuild summary view with filtered data
    this.buildSummaryView()
  }

  onTimeRangeChange(): void {
    // Clear custom date inputs if switching away from custom range
    if (this.selectedTimeRange !== 'custom') {
      this.customDateFrom = '';
      this.customDateTo = '';
    }
    this.applyFilters()
  }

  onStatusChange(): void {
    this.applyFilters()
  }

  onSearch(): void {
    this.applyFilters()
  }

  clearSearch(): void {
    this.searchTerm = ""
    this.applyFilters()
  }

  clearAllFilters(): void {
    this.searchTerm = ""
    this.selectedTimeRange = "24h"
    this.selectedStatus = "all"
    this.customDateFrom = ""
    this.customDateTo = ""
    this.applyFilters()
  }

  hasActiveFilters(): boolean {
    return this.searchTerm !== "" || 
           this.selectedStatus !== "all" || 
           this.selectedTimeRange !== "24h" ||
           (this.customDateFrom !== "" || this.customDateTo !== "");
  }

  // Sorting
  sort(field: string, dataArray?: LoginAttempt[]): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
    } else {
      this.sortField = field
      this.sortDirection = "desc"
    }

    // Determine which array to sort
    // Since the table is showing summaryAttempts, we need to sort that array
    const arrayToSort = dataArray || this.summaryAttempts

    // Check if array exists and has items
    if (!arrayToSort || arrayToSort.length === 0) {
      return
    }

    arrayToSort.sort((a, b) => {
      let aValue: any = a[field as keyof LoginAttempt]
      let bValue: any = b[field as keyof LoginAttempt]

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = ""
      if (bValue === null || bValue === undefined) bValue = ""

      if (field === "timestamp") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (field === "timeframe") {
        // Handle timeframe sorting by converting to minutes for comparison
        aValue = this.convertTimeframeToMinutes(aValue)
        bValue = this.convertTimeframeToMinutes(bValue)
      } else if (field === "attemptCount") {
        // Ensure numeric comparison for attempt count
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Case-insensitive string comparison
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return this.sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return this.sortDirection === "asc" ? 1 : -1
      return 0
    })

    // Only update pagination if we're sorting the main filtered attempts
    if (!dataArray) {
      this.updatePaginatedAttempts()
    }
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'fa-sort text-gray-400'
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up text-blue-600' : 'fa-sort-down text-blue-600'
  }

  private convertTimeframeToMinutes(timeframe: string): number {
    if (!timeframe) return 0
    
    const match = timeframe.match(/(\d+(?:\.\d+)?)\s*(min|hour|day|week|month|year)s?/i)
    if (!match) return 0
    
    const value = parseFloat(match[1])
    const unit = match[2].toLowerCase()
    
    switch (unit) {
      case 'min': return value
      case 'hour': return value * 60
      case 'day': return value * 60 * 24
      case 'week': return value * 60 * 24 * 7
      case 'month': return value * 60 * 24 * 30
      case 'year': return value * 60 * 24 * 365
      default: return 0
    }
  }

  // Pagination
  updatePaginatedAttempts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    this.paginatedAttempts = this.filteredAttempts.slice(startIndex, endIndex)
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updatePaginatedAttempts()
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(this.totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredAttempts.length)
  }

  // Selection management
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedAttempts = []
    } else {
      this.selectedAttempts = [...this.paginatedAttempts]
    }
  }

  toggleSelect(attempt: LoginAttempt): void {
    const index = this.selectedAttempts.findIndex((a) => a.id === attempt.id)
    if (index > -1) {
      this.selectedAttempts.splice(index, 1)
    } else {
      this.selectedAttempts.push(attempt)
    }
  }

  isSelected(attempt: LoginAttempt): boolean {
    return this.selectedAttempts.some((a) => a.id === attempt.id)
  }

  isAllSelected(): boolean {
    return this.paginatedAttempts.length > 0 && this.paginatedAttempts.every((attempt) => this.isSelected(attempt))
  }

  // Actions
  viewDetails(attempt: LoginAttempt): void {
    this.selectedAttemptDetails = attempt;
    setTimeout(() => {
      const modalEl = document.getElementById('detailsModal');
      if (modalEl && (window as any).bootstrap) {
        const modal = new (window as any).bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 0);
  }

  blockIP(attempt: LoginAttempt): void {
    console.log('Blocking IP:', attempt.ipAddress);
    this.loginAttemptsService.blockIP(attempt.ipAddress).subscribe({
      next: (res) => {
        console.log('Block IP response:', res);
        attempt.isBlocked = true
        attempt.status = "blocked"

        this.realtimeActivities.unshift({
          id: this.generateId(),
          timestamp: new Date().toISOString(),
          type: "warning",
          message: `IP ${attempt.ipAddress} has been blocked`,
        })

        // Show success confirmation modal
        this.banConfirmationData = {
          ip: attempt.ipAddress,
          username: attempt.username || 'Unknown',
          success: true,
          message: `IP ${attempt.ipAddress} has been successfully banned for 15 minutes.`,
          action: 'ban'
        };
        this.showBanConfirmationModal = true;

        console.log("Blocked IP:", attempt.ipAddress)
      },
      error: (err) => {
        console.error('Block IP error:', err);
        
        // Show error confirmation modal
        this.banConfirmationData = {
          ip: attempt.ipAddress,
          username: attempt.username || 'Unknown',
          success: false,
          message: `Failed to ban IP ${attempt.ipAddress}. Please try again.`,
          action: 'ban'
        };
        this.showBanConfirmationModal = true;
      }
    });
  }

  whitelistIP(attempt: LoginAttempt): void {
    attempt.isBlocked = false
    attempt.threatLevel = "low"

    this.realtimeActivities.unshift({
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: "success",
      message: `IP ${attempt.ipAddress} has been whitelisted`,
    })

    // Show whitelist confirmation modal
    this.banConfirmationData = {
      ip: attempt.ipAddress,
      username: attempt.username || 'Unknown',
      success: true,
      message: `IP ${attempt.ipAddress} has been successfully whitelisted.`,
      action: 'whitelist'
    };
    this.showBanConfirmationModal = true;

    console.log("Whitelisted IP:", attempt.ipAddress)
  }

  bulkBlock(): void {
    this.selectedAttempts.forEach((attempt) => {
      attempt.isBlocked = true
      attempt.status = "blocked"
    })

    this.realtimeActivities.unshift({
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: "warning",
      message: `${this.selectedAttempts.length} IPs have been blocked`,
    })

    this.selectedAttempts = []
    console.log("Bulk blocked selected IPs")
  }

  exportData(): void {
    const csvContent = this.generateCSV()
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `login-attempts-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  private generateCSV(): string {
    const headers = [
      "Timestamp",
      "Username",
      "IP Address",
      "Location",
      "Status",
      "Threat Level",
      "Attempt Count",
      "User Agent",
      "ISP",
    ]

    const rows = this.filteredAttempts.map((attempt) => [
      attempt.timestamp,
      attempt.username,
      attempt.ipAddress,
      attempt.location,
      attempt.status,
      attempt.threatLevel,
      attempt.attemptCount.toString(),
      attempt.userAgent,
      "Unknown ISP",
    ])

    return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")
  }

  refreshData(): void {
    this.isLoading = true

    setTimeout(() => {
      this.loadLoginAttempts()
      this.checkForCriticalAlerts()
      this.isLoading = false
    }, 1000)
  }

  viewAlerts(): void {
    console.log("Critical alerts:", this.criticalAlerts)
    // In a real app, you would show an alerts modal
  }

  clearActivityFeed(): void {
    this.realtimeActivities = []
  }

  copyToClipboard(value: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value);
    } else {
      // fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * Expose encodeURIComponent for use in the template
   */
  encodeURIComponent(value: string): string {
    return encodeURIComponent(value);
  }

  // Utility methods
  getThreatLevelClass(level: string): string {
    return level
  }

  getThreatCount(level: string): number {
    return this.filteredAttempts.filter((a) => a.threatLevel === level).length
  }

  getRowClass(attempt: LoginAttempt): string {
    if (attempt.threatLevel === "critical") return "critical-risk"
    if (attempt.threatLevel === "high") return "high-risk"
    return ""
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case "successful":
        return "fa-check"
      case "failed":
        return "fa-times"
      case "blocked":
        return "fa-ban"
      default:
        return "fa-question"
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case "success":
        return "fa-check"
      case "warning":
        return "fa-exclamation-triangle"
      case "danger":
        return "fa-times"
      default:
        return "fa-info"
    }
  }

  getCountryFlag(countryCode: string): string {
    return this.countryFlags[countryCode] || "🏳️"
  }

  getRelativeTime(timestamp: string): string {
    const now = new Date()
    const timestampDate = new Date(timestamp)
    if (Number.isNaN(timestampDate.getTime())) return ''
    const diff = now.getTime() - timestampDate.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`
    if (hours > 0) return `${hours} hr${hours === 1 ? '' : 's'} ago`
    if (minutes > 0) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
    return 'Just now'
  }

  trackByAttempt(index: number, attempt: LoginAttempt): number {
    return attempt.id
  }

  trackByActivity(index: number, activity: ActivityFeedItem): string {
    return activity.id
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private startRealTimeMonitoring(): void {
    if (this.realTimeSubscription) {
      this.realTimeSubscription.unsubscribe()
    }

    this.realTimeSubscription = interval(5000).subscribe(() => {
      if (this.isRealTimeActive) {
        // This method is no longer needed as notifications are handled by the service
      }
    })
  }

  private checkForCriticalAlerts(): void {
    const criticalAttempts = this.loginAttempts.filter(
      (a) => a.threatLevel === "critical" && new Date(a.timestamp) > new Date(Date.now() - 60 * 60 * 1000),
    )

    this.criticalAlerts = criticalAttempts.map(
      (a) => `Critical threat detected: ${a.attemptCount} attempts from ${a.location}`,
    )
  }

  private calculateStatistics(): void {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    const recent = this.loginAttempts.filter((a) => new Date(a.timestamp) >= last24h)
    const previous = this.loginAttempts.filter((a) => new Date(a.timestamp) >= last48h && new Date(a.timestamp) < last24h)

    const successfulCurrent = recent.filter((a) => a.status === "successful").length
    const successfulPrevious = previous.filter((a) => a.status === "successful").length
    const failedCurrent = recent.filter((a) => a.status === "failed").length
    const failedPrevious = previous.filter((a) => a.status === "failed").length
    const blockedCurrent = new Set(recent.filter((a) => a.isBlocked).map((a) => a.ipAddress)).size
    const blockedPrevious = new Set(previous.filter((a) => a.isBlocked).map((a) => a.ipAddress)).size
    const lockedCurrent = recent.filter((a) => a.status === "blocked").length
    const lockedPrevious = previous.filter((a) => a.status === "blocked").length

    this.statistics = {
      successfulLogins: successfulCurrent,
      failedLogins: failedCurrent,
      blockedIPs: blockedCurrent,
      lockedAccounts: lockedCurrent,
      successfulLoginsChange: this.calculatePercentageChange(successfulCurrent, successfulPrevious),
      failedLoginsChange: this.calculatePercentageChange(failedCurrent, failedPrevious),
      blockedIPsChange: this.calculatePercentageChange(blockedCurrent, blockedPrevious),
      lockedAccountsChange: this.calculatePercentageChange(lockedCurrent, lockedPrevious),
    }

    // Debug logging to verify calculations
    console.log('Statistics Calculation:', {
      successful: { current: successfulCurrent, previous: successfulPrevious, change: this.statistics.successfulLoginsChange },
      failed: { current: failedCurrent, previous: failedPrevious, change: this.statistics.failedLoginsChange },
      blocked: { current: blockedCurrent, previous: blockedPrevious, change: this.statistics.blockedIPsChange },
      locked: { current: lockedCurrent, previous: lockedPrevious, change: this.statistics.lockedAccountsChange }
    })
  }

  private calculatePercentageChange(current: number, previous: number): number {
    // Handle zero baseline case
    if (previous === 0) {
      if (current === 0) return 0  // 0 → 0 = 0% change
      if (current > 0) return 100  // 0 → any positive = +100% (new activity)
    }
    
    // Standard percentage change formula
    return Math.round(((current - previous) / previous) * 100)
  }

  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
  }

  private generateSessionId(): string {
    return "sess_" + Math.random().toString(36).substr(2, 16)
  }

  // Session activity log modal logic
  openSessionActivity(sessionId: string) {
    this.sessionActivitySessionId = sessionId;
    this.loginAttemptsService.getBySessionId(sessionId).subscribe((attempts) => {
      this.sessionActivityAttempts = attempts;
      this.showSessionActivityModal = true;
      setTimeout(() => {
        const modalEl = document.getElementById('sessionActivityModal');
        if (modalEl && (window as any).bootstrap) {
          const modal = new (window as any).bootstrap.Modal(modalEl);
          modal.show();
        }
      }, 0);
    });
  }
  closeSessionActivity() {
    this.showSessionActivityModal = false;
    this.sessionActivitySessionId = null;
    this.sessionActivityAttempts = [];
  }
  blockSession(sessionId: string) {
    this.loginAttemptsService.blockSession(sessionId).subscribe(() => {
      this.loadLoginAttempts();
      if (this.showSessionActivityModal) this.openSessionActivity(sessionId);
    });
  }
  whitelistSession(sessionId: string) {
    this.loginAttemptsService.whitelistSession(sessionId).subscribe(() => {
      this.loadLoginAttempts();
      if (this.showSessionActivityModal) this.openSessionActivity(sessionId);
    });
  }

  fetchSecurityPolicy() {
    this.http.get<any[]>('http://localhost:8080/api/login-attempts/security-policy').subscribe({
      next: (data) => {
        this.securityPolicy = data;
      },
      error: (err) => {
        console.error('Failed to fetch security policy:', err);
      }
    });
  }

  /**
   * Opens the detailed log modal for a specific attempt (by username & IP)
   */
  openDetailedLogModal(attempt: LoginAttempt): void {
    this.detailedLogContext = attempt;
    // Case-insensitive, trimmed filter for username and IP
    this.filteredDetailedLog = this.loginAttempts.filter(a =>
      a.username && attempt.username &&
      a.username.trim().toLowerCase() === attempt.username.trim().toLowerCase() &&
      a.ipAddress && attempt.ipAddress &&
      a.ipAddress.trim() === attempt.ipAddress.trim()
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    console.log('loginAttempts:', this.loginAttempts);
    console.log('filteredDetailedLog:', this.filteredDetailedLog);
    this.showDetailedLogModal = true;
  }

  /**
   * Closes the detailed log modal
   */
  closeDetailedLogModal(): void {
    this.showDetailedLogModal = false;
    this.detailedLogContext = null;
    this.filteredDetailedLog = [];
  }

  closeBanConfirmationModal(): void {
    this.showBanConfirmationModal = false;
    this.banConfirmationData = null;
  }
}
