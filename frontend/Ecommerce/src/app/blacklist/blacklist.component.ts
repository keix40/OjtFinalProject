import { Component, type OnInit } from "@angular/core"
import { FormBuilder, type FormGroup, Validators } from "@angular/forms"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { ReactiveFormsModule } from "@angular/forms"
declare var lucide: any;

interface BlacklistEntry {
  id: string
  targetType: "email" | "ip" | "device" | "phone" | "user_id"
  targetValue: string
  category: "fraud" | "spam" | "abuse" | "chargeback" | "fake_account" | "policy_violation"
  riskLevel: "low" | "medium" | "high" | "critical"
  reason: string
  addedDate: Date
  addedBy: string
  status: "active" | "appealed" | "expired" | "lifted"
  expiryDate?: Date
  associatedEmail?: string
  deviceFingerprint?: string
  incidentCount: number
  notes?: string
  isAutomatic: boolean
  lastIncidentDate: Date
}

interface AutoRules {
  failedPayments: boolean
  chargebacks: boolean
  suspiciousActivity: boolean
  multipleAccounts: boolean
  vpnDetection: boolean
}

@Component({
  selector: "app-blacklist",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./blacklist.component.html",
  styleUrls: ["./blacklist.component.css"]
})
export class BlacklistComponent implements OnInit {
  // Data properties
  allEntries: BlacklistEntry[] = []
  filteredEntries: BlacklistEntry[] = []
  paginatedEntries: BlacklistEntry[] = []
  selectedEntries: string[] = []
  selectedEntryDetails: BlacklistEntry | null = null

  // Filter properties
  searchTerm = ""
  categoryFilter = ""
  statusFilter = ""
  riskFilter = ""

  // UI state
  viewMode: "table" | "cards" = "table"
  currentPage = 1
  itemsPerPage = 12
  totalPages = 1

  // Auto rules
  autoRules: AutoRules = {
    failedPayments: true,
    chargebacks: true,
    suspiciousActivity: false,
    multipleAccounts: false,
    vpnDetection: false,
  }

  // Form
  blacklistForm: FormGroup

  // Utility property
  Math = Math

  constructor(private fb: FormBuilder) {
    this.blacklistForm = this.fb.group({
      targetType: ["email", Validators.required],
      targetValue: ["", Validators.required],
      category: ["fraud", Validators.required],
      riskLevel: ["medium", Validators.required],
      reason: ["", Validators.required],
      expiryDate: [""],
      associatedEmail: [""],
      notes: [""],
      notifyTeam: [true],
      blockRelated: [false],
    })
  }

  ngOnInit(): void {
    this.loadBlacklistEntries()
  }

  ngAfterViewInit() {
    lucide.createIcons();
  }
  ngAfterViewChecked() {
    lucide.createIcons();
  }

  loadBlacklistEntries(): void {
    // Mock data - replace with actual API call
    this.allEntries = this.generateMockEntries()
    this.applyFilters()
    lucide.createIcons();
  }

  generateMockEntries(): BlacklistEntry[] {
    const entries: BlacklistEntry[] = []
    const targetTypes: BlacklistEntry["targetType"][] = ["email", "ip", "device", "phone", "user_id"]
    const categories: BlacklistEntry["category"][] = [
      "fraud",
      "spam",
      "abuse",
      "chargeback",
      "fake_account",
      "policy_violation",
    ]
    const riskLevels: BlacklistEntry["riskLevel"][] = ["low", "medium", "high", "critical"]
    const statuses: BlacklistEntry["status"][] = ["active", "appealed", "expired", "lifted"]

    const reasons = [
      "Multiple failed payment attempts",
      "Chargeback fraud pattern detected",
      "Fake account creation",
      "Spam complaints received",
      "Policy violation - harassment",
      "Suspicious login activity",
      "Credit card fraud attempt",
      "Account takeover attempt",
      "Phishing activity detected",
      "Abuse of refund policy",
    ]

    for (let i = 0; i < 75; i++) {
      const targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)]
      const addedDate = new Date()
      addedDate.setDate(addedDate.getDate() - Math.floor(Math.random() * 180))

      const lastIncidentDate = new Date(addedDate)
      lastIncidentDate.setDate(lastIncidentDate.getDate() + Math.floor(Math.random() * 30))

      let targetValue = ""
      switch (targetType) {
        case "email":
          targetValue = `suspicious${i + 1}@example.com`
          break
        case "ip":
          targetValue = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
          break
        case "device":
          targetValue = `device_${Math.random().toString(36).substring(2, 15)}`
          break
        case "phone":
          targetValue = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
          break
        case "user_id":
          targetValue = `user_${Math.floor(Math.random() * 10000)}`
          break
      }

      entries.push({
        id: `BL${String(i + 1).padStart(3, "0")}`,
        targetType,
        targetValue,
        category: categories[Math.floor(Math.random() * categories.length)],
        riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        addedDate,
        addedBy: Math.random() > 0.3 ? "Security Team" : "Auto-System",
        status: statuses[Math.floor(Math.random() * statuses.length)],
        expiryDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000) : undefined,
        associatedEmail: targetType !== "email" && Math.random() > 0.4 ? `related${i}@example.com` : undefined,
        deviceFingerprint: Math.random() > 0.6 ? Math.random().toString(36).substring(2, 20) : undefined,
        incidentCount: Math.floor(Math.random() * 10) + 1,
        notes: Math.random() > 0.5 ? `Additional security notes for entry ${i + 1}` : undefined,
        isAutomatic: Math.random() > 0.4,
        lastIncidentDate,
      })
    }

    return entries.sort((a, b) => b.addedDate.getTime() - a.addedDate.getTime())
  }

  // Statistics getters
  get totalBlacklisted(): number {
    return this.allEntries.filter((e) => e.status === "active").length
  }

  get newThisWeek(): number {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return this.allEntries.filter((e) => e.addedDate >= weekAgo).length
  }

  get fraudPrevented(): number {
    return this.allEntries.reduce((sum, entry) => sum + entry.incidentCount, 0)
  }

  get estimatedSavings(): number {
    return this.allEntries.reduce((sum, entry) => {
      const avgLoss = entry.riskLevel === "critical" ? 500 : entry.riskLevel === "high" ? 200 : 100
      return sum + entry.incidentCount * avgLoss
    }, 0)
  }

  get pendingAppeals(): number {
    return this.allEntries.filter((e) => e.status === "appealed").length
  }

  get avgAppealTime(): number {
    return 24 // Mock average appeal response time in hours
  }

  // Filter methods
  applyFilters(): void {
    this.filteredEntries = this.allEntries.filter((entry) => {
      const matchesSearch =
        !this.searchTerm ||
        entry.targetValue.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        entry.reason.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (entry.associatedEmail && entry.associatedEmail.toLowerCase().includes(this.searchTerm.toLowerCase()))

      const matchesCategory = !this.categoryFilter || entry.category === this.categoryFilter
      const matchesStatus = !this.statusFilter || entry.status === this.statusFilter
      const matchesRisk = !this.riskFilter || entry.riskLevel === this.riskFilter

      return matchesSearch && matchesCategory && matchesStatus && matchesRisk
    })

    this.currentPage = 1
    this.updatePagination()
    lucide.createIcons();
  }

  clearFilters(): void {
    this.searchTerm = ""
    this.categoryFilter = ""
    this.statusFilter = ""
    this.riskFilter = ""
    this.applyFilters()
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEntries.length / this.itemsPerPage)
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1)

    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    this.paginatedEntries = this.filteredEntries.slice(startIndex, endIndex)
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updatePagination()
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  // Selection methods
  selectAll(event: any): void {
    if (event.target.checked) {
      this.selectedEntries = this.paginatedEntries.map((entry) => entry.id)
    } else {
      this.selectedEntries = []
    }
  }

  toggleEntrySelection(entryId: string, event: any): void {
    if (event.target.checked) {
      this.selectedEntries.push(entryId)
    } else {
      this.selectedEntries = this.selectedEntries.filter((id) => id !== entryId)
    }
  }

  // View methods
  setViewMode(mode: "table" | "cards"): void {
    this.viewMode = mode
    lucide.createIcons();
  }

  // Entry management methods
  openAddBlacklistModal(): void {
    this.blacklistForm.reset({
      targetType: "email",
      category: "fraud",
      riskLevel: "medium",
      notifyTeam: true,
      blockRelated: false,
    })
  }

  addToBlacklist(): void {
    if (this.blacklistForm.valid) {
      const formValue = this.blacklistForm.value

      const newEntry: BlacklistEntry = {
        id: `BL${String(this.allEntries.length + 1).padStart(3, "0")}`,
        targetType: formValue.targetType,
        targetValue: formValue.targetValue,
        category: formValue.category,
        riskLevel: formValue.riskLevel,
        reason: formValue.reason,
        addedDate: new Date(),
        addedBy: "Current User",
        status: "active",
        expiryDate: formValue.expiryDate ? new Date(formValue.expiryDate) : undefined,
        associatedEmail: formValue.associatedEmail,
        incidentCount: 1,
        notes: formValue.notes,
        isAutomatic: false,
        lastIncidentDate: new Date(),
      }

      this.allEntries.unshift(newEntry)
      this.applyFilters()

      console.log("Added to blacklist:", newEntry)
      alert("Entry added to blacklist successfully!")

      // Reset form
      this.blacklistForm.reset()
    }
  }

  previewBlacklist(): void {
    const formValue = this.blacklistForm.value
    console.log("Preview blacklist impact:", formValue)
    // Implement preview functionality
  }

  viewEntryDetails(entry: BlacklistEntry): void {
    this.selectedEntryDetails = entry
    lucide.createIcons();
  }

  editEntry(entry: BlacklistEntry): void {
    console.log("Edit entry:", entry)
    // Implement edit functionality
  }

  liftBan(entry: BlacklistEntry): void {
    if (confirm(`Lift ban for ${entry.targetValue}?`)) {
      entry.status = "lifted"
      console.log("Ban lifted for:", entry)
      alert("Ban has been lifted successfully!")
    }
  }

  extendBan(entry: BlacklistEntry): void {
    console.log("Extend ban for:", entry)
    // Implement ban extension functionality
  }

  addNote(entry: BlacklistEntry): void {
    const note = prompt("Add a note for this entry:")
    if (note) {
      entry.notes = entry.notes ? `${entry.notes}\n\n${note}` : note
      console.log("Note added to:", entry)
    }
  }

  viewIncidentHistory(entry: BlacklistEntry): void {
    console.log("View incident history for:", entry)
    // Implement incident history view
  }

  // Bulk actions
  bulkLiftBan(): void {
    if (confirm(`Lift ban for ${this.selectedEntries.length} selected entries?`)) {
      this.allEntries.forEach((entry) => {
        if (this.selectedEntries.includes(entry.id)) {
          entry.status = "lifted"
        }
      })
      this.selectedEntries = []
      this.applyFilters()
      console.log("Bulk ban lift completed")
    }
  }

  bulkExtendBan(): void {
    console.log("Bulk extend ban for:", this.selectedEntries)
    // Implement bulk ban extension
  }

  bulkUpdateCategory(): void {
    console.log("Bulk update category for:", this.selectedEntries)
    // Implement bulk category update
  }

  bulkExport(): void {
    const selectedData = this.allEntries.filter((e) => this.selectedEntries.includes(e.id))
    this.exportBlacklistData(selectedData)
  }

  // Auto rules management
  updateAutoRule(ruleName: keyof AutoRules): void {
    console.log(`Auto rule ${ruleName} updated:`, this.autoRules[ruleName])
    // Implement auto rule update API call
  }

  manageAutoRules(): void {
    console.log("Open auto rules management")
    // Implement comprehensive auto rules management
  }

  // Form helpers
  onTargetTypeChange(): void {
    const targetType = this.blacklistForm.get("targetType")?.value
    this.blacklistForm.get("targetValue")?.setValue("")
  }

  getTargetPlaceholder(): string {
    const targetType = this.blacklistForm.get("targetType")?.value
    const placeholders = {
      email: "user@example.com",
      ip: "192.168.1.1",
      device: "device_fingerprint_hash",
      phone: "+1234567890",
      user_id: "user_12345",
    }
    return placeholders[targetType as keyof typeof placeholders] || ""
  }

  getAffectedAccounts(): number {
    // Mock calculation based on target value
    return Math.floor(Math.random() * 5) + 1
  }

  getRelatedEntries(): number {
    // Mock calculation for related entries
    return Math.floor(Math.random() * 3)
  }

  getRiskScore(): number {
    const riskLevel = this.blacklistForm.get("riskLevel")?.value
    const scores = { low: 25, medium: 50, high: 75, critical: 95 }
    return scores[riskLevel as keyof typeof scores] || 50
  }

  // Utility methods
  getTargetIconName(targetType: string): string {
    switch (targetType) {
      case 'email': return 'mail';
      case 'ip': return 'globe';
      case 'device': return 'smartphone';
      case 'phone': return 'phone';
      case 'user_id': return 'user';
      default: return 'user';
    }
  }

  getTargetTypeLabel(targetType: string): string {
    const labels = {
      email: "Email Address",
      ip: "IP Address",
      device: "Device Fingerprint",
      phone: "Phone Number",
      user_id: "User ID",
    }
    return labels[targetType as keyof typeof labels] || targetType
  }

  getCategoryIconName(category: string): string {
    switch (category) {
      case 'fraud': return 'alert-triangle';
      case 'spam': return 'message-circle';
      case 'abuse': return 'slash';
      case 'chargeback': return 'credit-card';
      case 'fake_account': return 'user-x';
      case 'policy_violation': return 'file-warning';
      default: return 'alert-circle';
    }
  }

  getCategoryLabel(category: string): string {
    const labels = {
      fraud: "Fraud",
      spam: "Spam",
      abuse: "Abuse",
      chargeback: "Chargeback",
      fake_account: "Fake Account",
      policy_violation: "Policy Violation",
    }
    return labels[category as keyof typeof labels] || category
  }

  getRiskIconName(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical': return 'flame';
      case 'high': return 'trending-up';
      case 'medium': return 'activity';
      case 'low': return 'shield';
      default: return 'help-circle';
    }
  }

  getStatusIconName(status: string): string {
    switch (status) {
      case 'active': return 'lock';
      case 'appealed': return 'clock';
      case 'expired': return 'calendar-x';
      case 'lifted': return 'unlock';
      default: return 'help-circle';
    }
  }

  getStatusLabel(status: string): string {
    const labels = {
      active: "Active",
      appealed: "Under Appeal",
      expired: "Expired",
      lifted: "Lifted",
    }
    return labels[status as keyof typeof labels] || status
  }

  getTimeAgo(date: Date): string {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  getBlockedAttempts(entry: BlacklistEntry): number {
    return entry.incidentCount * Math.floor(Math.random() * 5) + entry.incidentCount
  }

  getEstimatedLoss(entry: BlacklistEntry): number {
    const avgLoss = entry.riskLevel === "critical" ? 500 : entry.riskLevel === "high" ? 200 : 100
    return entry.incidentCount * avgLoss
  }

  getLastIncidentDays(entry: BlacklistEntry): number {
    const now = new Date()
    const diffInMs = now.getTime() - entry.lastIncidentDate.getTime()
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  }

  refreshData(): void {
    this.loadBlacklistEntries()
    console.log("Blacklist data refreshed")
  }

  exportBlacklist(): void {
    this.exportBlacklistData(this.filteredEntries)
  }

  exportBlacklistData(entries: BlacklistEntry[]): void {
    const csvContent = this.generateBlacklistCSV(entries)
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `blacklist-entries-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  generateBlacklistCSV(entries: BlacklistEntry[]): string {
    const headers = [
      "Target Type",
      "Target Value",
      "Category",
      "Risk Level",
      "Reason",
      "Status",
      "Added Date",
      "Added By",
      "Incident Count",
      "Associated Email",
      "Notes",
    ]

    const rows = entries.map((entry) => [
      this.getTargetTypeLabel(entry.targetType),
      entry.targetValue,
      this.getCategoryLabel(entry.category),
      entry.riskLevel,
      entry.reason,
      this.getStatusLabel(entry.status),
      entry.addedDate.toISOString().split("T")[0],
      entry.addedBy,
      entry.incidentCount.toString(),
      entry.associatedEmail || "",
      entry.notes || "",
    ])

    return [headers, ...rows].map((row) => row.join(",")).join("\n")
  }

  trackByEntryId(index: number, entry: BlacklistEntry): string {
    return entry.id
  }

  getAutomaticIconName(isAutomatic: boolean): string {
    return isAutomatic ? 'bot' : 'user';
  }
}
