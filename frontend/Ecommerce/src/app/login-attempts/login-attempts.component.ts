import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { interval, type Subscription } from "rxjs"

interface LoginAttempt {
  id: string
  timestamp: Date
  username: string
  ipAddress: string
  location: string
  countryCode: string
  status: "successful" | "failed" | "blocked"
  threatLevel: "low" | "medium" | "high" | "critical"
  attemptCount: number
  timeframe: string
  userAgent: string
  isp: string
  isVPN: boolean
  isProxy: boolean
  sessionId: string
  threatScore: number
  userRole?: string
  isBlocked: boolean
}

interface ActivityFeedItem {
  id: string
  timestamp: Date
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

  // Pagination properties
  currentPage = 1
  itemsPerPage = 20
  totalPages = 1

  // UI state properties
  isRealTimeActive = true
  isLoading = false

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

  ngOnInit(): void {
    this.generateMockData()
    this.calculateStatistics()
    this.applyFilters()
    this.startRealTimeMonitoring()
    this.checkForCriticalAlerts()
  }

  ngOnDestroy(): void {
    if (this.realTimeSubscription) {
      this.realTimeSubscription.unsubscribe()
    }
  }

  // Data generation and management
  private generateMockData(): void {
    const usernames = ["admin", "user123", "john.doe", "alice.smith", "bob.wilson", "hacker123", "test.user", "manager"]
    const locations = [
      { city: "New York, US", code: "US" },
      { city: "Moscow, RU", code: "RU" },
      { city: "Beijing, CN", code: "CN" },
      { city: "Berlin, DE", code: "DE" },
      { city: "London, GB", code: "GB" },
      { city: "Paris, FR", code: "FR" },
      { city: "Tokyo, JP", code: "JP" },
      { city: "Seoul, KR", code: "KR" },
    ]
    const isps = ["Comcast", "Verizon", "AT&T", "Deutsche Telekom", "China Telecom", "NTT", "Orange", "Vodafone"]
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)",
    ]

    this.loginAttempts = []

    for (let i = 0; i < 500; i++) {
      const location = locations[Math.floor(Math.random() * locations.length)]
      const isSuccessful = Math.random() > 0.3
      const isSuspicious = Math.random() > 0.8
      const attemptCount = isSuspicious ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 5) + 1

      const attempt: LoginAttempt = {
        id: this.generateId(),
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        username: usernames[Math.floor(Math.random() * usernames.length)],
        ipAddress: this.generateRandomIP(),
        location: location.city,
        countryCode: location.code,
        status: isSuccessful ? "successful" : Math.random() > 0.8 ? "blocked" : "failed",
        threatLevel: this.calculateThreatLevel(attemptCount, isSuspicious),
        attemptCount: attemptCount,
        timeframe: this.generateTimeframe(attemptCount),
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        isp: isps[Math.floor(Math.random() * isps.length)],
        isVPN: Math.random() > 0.9,
        isProxy: Math.random() > 0.95,
        sessionId: this.generateSessionId(),
        threatScore: Math.floor(Math.random() * 100),
        userRole: Math.random() > 0.7 ? ["Admin", "Manager", "User"][Math.floor(Math.random() * 3)] : undefined,
        isBlocked: Math.random() > 0.9,
      }

      this.loginAttempts.push(attempt)
    }

    // Sort by timestamp (newest first)
    this.loginAttempts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
  }

  private generateSessionId(): string {
    return "sess_" + Math.random().toString(36).substr(2, 16)
  }

  private calculateThreatLevel(attemptCount: number, isSuspicious: boolean): "low" | "medium" | "high" | "critical" {
    if (attemptCount > 30 || isSuspicious) return "critical"
    if (attemptCount > 15) return "high"
    if (attemptCount > 5) return "medium"
    return "low"
  }

  private generateTimeframe(attemptCount: number): string {
    if (attemptCount > 20) return "5 min"
    if (attemptCount > 10) return "15 min"
    if (attemptCount > 5) return "1 hour"
    return "24 hours"
  }

  private calculateStatistics(): void {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    const recent = this.loginAttempts.filter((a) => a.timestamp >= last24h)
    const previous = this.loginAttempts.filter((a) => a.timestamp >= last48h && a.timestamp < last24h)

    this.statistics = {
      successfulLogins: recent.filter((a) => a.status === "successful").length,
      failedLogins: recent.filter((a) => a.status === "failed").length,
      blockedIPs: new Set(recent.filter((a) => a.isBlocked).map((a) => a.ipAddress)).size,
      lockedAccounts: recent.filter((a) => a.status === "blocked").length,
      successfulLoginsChange: this.calculatePercentageChange(
        recent.filter((a) => a.status === "successful").length,
        previous.filter((a) => a.status === "successful").length,
      ),
      failedLoginsChange: this.calculatePercentageChange(
        recent.filter((a) => a.status === "failed").length,
        previous.filter((a) => a.status === "failed").length,
      ),
      blockedIPsChange: this.calculatePercentageChange(
        new Set(recent.filter((a) => a.isBlocked).map((a) => a.ipAddress)).size,
        new Set(previous.filter((a) => a.isBlocked).map((a) => a.ipAddress)).size,
      ),
      lockedAccountsChange: this.calculatePercentageChange(
        recent.filter((a) => a.status === "blocked").length,
        previous.filter((a) => a.status === "blocked").length,
      ),
    }
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  // Real-time monitoring
  private startRealTimeMonitoring(): void {
    if (this.realTimeSubscription) {
      this.realTimeSubscription.unsubscribe()
    }

    this.realTimeSubscription = interval(5000).subscribe(() => {
      if (this.isRealTimeActive) {
        this.simulateRealTimeActivity()
      }
    })
  }

  private simulateRealTimeActivity(): void {
    if (Math.random() > 0.7) {
      const activities = [
        { type: "success", message: "User successfully logged in from New York, US" },
        { type: "warning", message: "5 failed login attempts detected from suspicious IP" },
        { type: "danger", message: "Critical: 25 failed attempts from Moscow, RU - IP blocked" },
        { type: "warning", message: "VPN connection detected from Germany" },
        { type: "success", message: "Admin user authenticated successfully" },
      ]

      const activity = activities[Math.floor(Math.random() * activities.length)]

      this.realtimeActivities.unshift({
        id: this.generateId(),
        timestamp: new Date(),
        type: activity.type as "success" | "warning" | "danger",
        message: activity.message,
      })

      // Keep only last 20 activities
      if (this.realtimeActivities.length > 20) {
        this.realtimeActivities = this.realtimeActivities.slice(0, 20)
      }

      // Add new login attempt occasionally
      if (Math.random() > 0.8) {
        this.addNewLoginAttempt()
      }
    }
  }

  private addNewLoginAttempt(): void {
    const newAttempt: LoginAttempt = {
      id: this.generateId(),
      timestamp: new Date(),
      username: ["admin", "user123", "hacker"][Math.floor(Math.random() * 3)],
      ipAddress: this.generateRandomIP(),
      location: "Moscow, RU",
      countryCode: "RU",
      status: Math.random() > 0.7 ? "failed" : "successful",
      threatLevel: Math.random() > 0.5 ? "high" : "medium",
      attemptCount: Math.floor(Math.random() * 20) + 5,
      timeframe: "5 min",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      isp: "Unknown ISP",
      isVPN: Math.random() > 0.8,
      isProxy: Math.random() > 0.9,
      sessionId: this.generateSessionId(),
      threatScore: Math.floor(Math.random() * 100),
      isBlocked: Math.random() > 0.8,
    }

    this.loginAttempts.unshift(newAttempt)
    this.applyFilters()
    this.calculateStatistics()
  }

  private checkForCriticalAlerts(): void {
    const criticalAttempts = this.loginAttempts.filter(
      (a) => a.threatLevel === "critical" && a.timestamp > new Date(Date.now() - 60 * 60 * 1000), // Last hour
    )

    this.criticalAlerts = criticalAttempts.map(
      (a) => `Critical threat detected: ${a.attemptCount} attempts from ${a.location}`,
    )
  }

  // Filtering and searching
  applyFilters(): void {
    let filtered = [...this.loginAttempts]

    // Time range filter
    const now = new Date()
    let timeLimit: Date

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
      default:
        timeLimit = new Date(0)
    }

    filtered = filtered.filter((attempt) => attempt.timestamp >= timeLimit)

    // Status filter
    if (this.selectedStatus !== "all") {
      if (this.selectedStatus === "suspicious") {
        filtered = filtered.filter((attempt) => attempt.threatLevel === "high" || attempt.threatLevel === "critical")
      } else {
        filtered = filtered.filter((attempt) => attempt.status === this.selectedStatus)
      }
    }

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (attempt) =>
          attempt.username.toLowerCase().includes(term) ||
          attempt.ipAddress.includes(term) ||
          attempt.location.toLowerCase().includes(term),
      )
    }

    this.filteredAttempts = filtered
    this.totalPages = Math.ceil(this.filteredAttempts.length / this.itemsPerPage)
    this.currentPage = 1
    this.updatePaginatedAttempts()
  }

  onTimeRangeChange(): void {
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

  // Sorting
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
    } else {
      this.sortField = field
      this.sortDirection = "desc"
    }

    this.filteredAttempts.sort((a, b) => {
      let aValue: any = a[field as keyof LoginAttempt]
      let bValue: any = b[field as keyof LoginAttempt]

      if (field === "timestamp") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (aValue < bValue) return this.sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return this.sortDirection === "asc" ? 1 : -1
      return 0
    })

    this.updatePaginatedAttempts()
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
    this.selectedAttemptDetails = attempt
    // In a real app, you would open a modal here
    console.log("View details for:", attempt)
  }

  blockIP(attempt: LoginAttempt): void {
    attempt.isBlocked = true
    attempt.status = "blocked"

    this.realtimeActivities.unshift({
      id: this.generateId(),
      timestamp: new Date(),
      type: "warning",
      message: `IP ${attempt.ipAddress} has been blocked`,
    })

    console.log("Blocked IP:", attempt.ipAddress)
  }

  whitelistIP(attempt: LoginAttempt): void {
    attempt.isBlocked = false
    attempt.threatLevel = "low"

    this.realtimeActivities.unshift({
      id: this.generateId(),
      timestamp: new Date(),
      type: "success",
      message: `IP ${attempt.ipAddress} has been whitelisted`,
    })

    console.log("Whitelisted IP:", attempt.ipAddress)
  }

  bulkBlock(): void {
    this.selectedAttempts.forEach((attempt) => {
      attempt.isBlocked = true
      attempt.status = "blocked"
    })

    this.realtimeActivities.unshift({
      id: this.generateId(),
      timestamp: new Date(),
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
      attempt.timestamp.toISOString(),
      attempt.username,
      attempt.ipAddress,
      attempt.location,
      attempt.status,
      attempt.threatLevel,
      attempt.attemptCount.toString(),
      attempt.userAgent,
      attempt.isp,
    ])

    return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")
  }

  refreshData(): void {
    this.isLoading = true

    setTimeout(() => {
      this.generateMockData()
      this.calculateStatistics()
      this.applyFilters()
      this.checkForCriticalAlerts()
      this.isLoading = false
    }, 1000)
  }

  toggleRealTimeMonitoring(): void {
    this.isRealTimeActive = !this.isRealTimeActive

    if (this.isRealTimeActive) {
      this.startRealTimeMonitoring()
    }
  }

  viewAlerts(): void {
    console.log("Critical alerts:", this.criticalAlerts)
    // In a real app, you would show an alerts modal
  }

  clearActivityFeed(): void {
    this.realtimeActivities = []
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

  getRelativeTime(timestamp: Date): string {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  trackByAttempt(index: number, attempt: LoginAttempt): string {
    return attempt.id
  }

  trackByActivity(index: number, activity: ActivityFeedItem): string {
    return activity.id
  }
}
