import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ReactiveFormsModule } from "@angular/forms";
import { BlacklistService, BlacklistEntry, BlacklistStats, AutoRules } from "../services/blacklist.service";
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
declare var lucide: any;

@Component({
  selector: "app-blacklist",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./blacklist.component.html",
  styleUrls: ["./blacklist.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlacklistComponent implements OnInit, OnDestroy {
  // Data properties
  filteredEntries: BlacklistEntry[] = [];
  paginatedEntries: BlacklistEntry[] = [];
  selectedEntries: string[] = [];
  selectedEntryDetails: BlacklistEntry | null = null;
  stats: BlacklistStats | null = null;
  showEditModal = false;
  showIncidentHistoryModal = false;
  incidentHistory: any[] = [];

  // Filter properties
  searchTerm = "";
  categoryFilter = "";
  statusFilter = "";
  riskFilter = "";

  // UI state
  viewMode: "table" | "cards" = "table";
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;
  loading = false;
  private destroy$ = new Subject<void>();

  // Auto rules
  autoRules: AutoRules = {
    failedPayments: true,
    chargebacks: true,
    suspiciousActivity: false,
    multipleAccounts: false,
    vpnDetection: false,
  };

  // Add missing properties for template binding
  fraudPrevented: number = 0;
  estimatedSavings: number = 0;
  pendingAppeals: number = 0;
  avgAppealTime: number = 0;
  activeTab: string = 'overview';
  Math = Math;

  // Form
  blacklistForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private blacklistService: BlacklistService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.blacklistForm = this.fb.group({
      targetType: ["email", Validators.required],
      targetValue: ["", Validators.required],
      category: ["fraud", Validators.required],
      riskLevel: ["medium", Validators.required],
      reason: ["", Validators.required],
      expiryDate: [""],
      associatedEmail: ["", [Validators.email]],
      notes: [""],
      notifyTeam: [true],
      blockRelated: [false],
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadAutoRules();
    // Demo/mock values for dashboard stats
    this.fraudPrevented = 42; // Replace with real value if available
    this.estimatedSavings = 1200; // Replace with real value if available
    this.pendingAppeals = 3; // Replace with real value if available
    this.avgAppealTime = 12; // Replace with real value if available
    // Setup debounced search
    this.blacklistForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons(): void {
    setTimeout(() => lucide.createIcons(), 0);
  }

  loadData(): void {
    this.loading = true;
    this.filteredEntries = [];
    this.paginatedEntries = [];
    this.cdr.markForCheck();

    forkJoin([
      this.blacklistService.getStats().pipe(
        catchError(() => of(null))
      ),
      this.blacklistService.getEntries({
        search: this.searchTerm,
        category: this.categoryFilter,
        status: this.statusFilter,
        riskLevel: this.riskFilter,
        page: this.currentPage - 1,
        pageSize: this.itemsPerPage
      }).pipe(
        catchError(() => of({ entries: [], total: 0, totalPages: 0, currentPage: 0 }))
      )
    ]).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ([stats, entriesResponse]) => {
        this.stats = stats;
        
        if (entriesResponse) {
          this.filteredEntries = entriesResponse.entries;
          this.paginatedEntries = entriesResponse.entries;
          this.totalItems = entriesResponse.total;
          
          if (this.currentPage > entriesResponse.totalPages && entriesResponse.totalPages > 0) {
            this.currentPage = entriesResponse.totalPages;
          }
        }
        
        this.loading = false;
        this.cdr.markForCheck();
        this.refreshIcons();
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error('Failed to load data');
        console.error('Error loading data:', error);
        this.cdr.markForCheck();
      }
    });
  }

  loadAutoRules(): void {
    this.blacklistService.getAutoRules()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rules) => {
          this.autoRules = rules;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.toastr.error('Failed to load auto rules');
          console.error('Error loading auto rules:', error);
        }
      });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadData();
  }

  clearFilters(): void {
    this.searchTerm = "";
    this.categoryFilter = "";
    this.statusFilter = "";
    this.riskFilter = "";
    this.applyFilters();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadData();
    }
  }

  getPageNumbers(): number[] {
    if (this.totalPages <= 1) return [];
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  // Selection methods
  selectAll(event: any): void {
    if (event.target.checked) {
      this.selectedEntries = this.paginatedEntries.map((entry) => entry.id);
    } else {
      this.selectedEntries = [];
    }
  }

  toggleEntrySelection(entryId: string, event: any): void {
    if (event.target.checked) {
      this.selectedEntries.push(entryId);
    } else {
      this.selectedEntries = this.selectedEntries.filter((id) => id !== entryId);
    }
  }

  // View methods
  setViewMode(mode: "table" | "cards"): void {
    this.viewMode = mode;
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
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  closeIncidentHistoryModal(): void {
    this.showIncidentHistoryModal = false;
  }

  addToBlacklist(): void {
    if (this.blacklistForm.valid) {
      const formValue = this.blacklistForm.value;
      // Ensure enums are sent in uppercase as required by backend
      this.blacklistService.addEntry({
        targetType: formValue.targetType ? formValue.targetType.toUpperCase() : undefined,
        targetValue: formValue.targetValue,
        category: formValue.category ? formValue.category.toUpperCase() : undefined,
        riskLevel: formValue.riskLevel ? formValue.riskLevel.toUpperCase() : undefined,
        reason: formValue.reason,
        expiryDate: formValue.expiryDate ? new Date(formValue.expiryDate) : undefined,
        associatedEmail: formValue.associatedEmail,
        notes: formValue.notes,
        addedBy: 'System' // Default value; replace with actual user if available
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Entry added to blacklist successfully');
          this.loadData();
          this.blacklistForm.reset();
          this.showEditModal = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.toastr.error('Failed to add entry to blacklist');
          console.error('Error adding entry:', error);
        }
      });
    }
  }

  // Similar updates for other methods that modify state
  liftBan(entry: BlacklistEntry): void {
    if (confirm(`Lift ban for ${entry.targetValue}?`)) {
      this.blacklistService.liftBan(entry.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Ban lifted successfully');
            this.loadData();
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.toastr.error('Failed to lift ban');
            console.error('Error lifting ban:', error);
          }
        });
    }
  }


  viewEntryDetails(entry: BlacklistEntry): void {
    this.blacklistService.getEntry(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.selectedEntryDetails = details;
          lucide.createIcons();
        },
        error: (error) => {
          this.toastr.error('Failed to load entry details');
          console.error('Error loading entry details:', error);
        }
      });
  }

  

  addNote(entry: BlacklistEntry): void {
    const note = prompt("Add a note for this entry:");
    if (note) {
      this.blacklistService.addNote(entry.id, note)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedEntry) => {
            this.toastr.success('Note added successfully');
            if (this.selectedEntryDetails?.id === entry.id) {
              this.selectedEntryDetails = updatedEntry;
            }
            this.loadData();
          },
          error: (error) => {
            this.toastr.error('Failed to add note');
            console.error('Error adding note:', error);
          }
        });
    }
  }

  // Bulk actions
  bulkLiftBan(): void {
    if (confirm(`Lift ban for ${this.selectedEntries.length} selected entries?`)) {
      this.blacklistService.bulkLiftBan(this.selectedEntries)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Bans lifted successfully');
            this.selectedEntries = [];
            this.loadData();
          },
          error: (error) => {
            this.toastr.error('Failed to lift bans');
            console.error('Error lifting bans:', error);
          }
        });
    }
  }

  bulkExtendBan(): void {
    const date = prompt("Enter new expiry date (YYYY-MM-DD):");
    if (date) {
      const newExpiryDate = new Date(date);
      this.blacklistService.bulkExtendBan(this.selectedEntries, newExpiryDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Bans extended successfully');
            this.selectedEntries = [];
            this.loadData();
          },
          error: (error) => {
            this.toastr.error('Failed to extend bans');
            console.error('Error extending bans:', error);
          }
        });
    }
  }

  bulkUpdateCategory(): void {
    const category = prompt("Enter new category (fraud/spam/abuse/chargeback/fake_account/policy_violation):");
    if (category) {
      this.blacklistService.bulkUpdateCategory(this.selectedEntries, category)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Categories updated successfully');
            this.selectedEntries = [];
            this.loadData();
          },
          error: (error) => {
            this.toastr.error('Failed to update categories');
            console.error('Error updating categories:', error);
          }
        });
    }
  }

  bulkExport(): void {
    this.blacklistService.exportEntries({
      search: this.searchTerm,
      category: this.categoryFilter,
      status: this.statusFilter,
      riskLevel: this.riskFilter
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `blacklist-entries-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.toastr.error('Failed to export entries');
        console.error('Error exporting entries:', error);
      }
    });
  }

  // Auto rules management
  updateAutoRule(ruleName: keyof AutoRules): void {
    this.blacklistService.updateAutoRules({
      [ruleName]: this.autoRules[ruleName]
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (updatedRules) => {
        this.autoRules = updatedRules;
        this.toastr.success('Auto rule updated successfully');
      },
      error: (error) => {
        this.toastr.error('Failed to update auto rule');
        console.error('Error updating auto rule:', error);
      }
    });
  }

  // Form helpers
  onTargetTypeChange(): void {
    const targetType = this.blacklistForm.get("targetType")?.value;
    this.blacklistForm.get("targetValue")?.setValue("");
  }

  getTargetPlaceholder(): string {
    const targetType = this.blacklistForm.get("targetType")?.value;
    const placeholders = {
      email: "user@example.com",
      ip: "192.168.1.1",
      device: "device_fingerprint_hash",
      phone: "+1234567890",
      user_id: "user_12345",
    };
    return placeholders[targetType as keyof typeof placeholders] || "";
  }

  // Utility methods for icons and labels
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
    };
    return labels[targetType as keyof typeof labels] || targetType;
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
    };
    return labels[category as keyof typeof labels] || category;
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
    };
    return labels[status as keyof typeof labels] || status;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }

  getBlockedAttempts(entry: BlacklistEntry): number {
    return entry.incidentCount;
  }

  getEstimatedLoss(entry: BlacklistEntry): number {
    const avgLoss = entry.riskLevel === "critical" ? 500 : entry.riskLevel === "high" ? 200 : 100;
    return entry.incidentCount * avgLoss;
  }

  getLastIncidentDays(entry: BlacklistEntry): number {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(entry.lastIncidentDate).getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  }

  refreshData(): void {
    this.loadData();
    this.toastr.info('Refreshing data...');
  }

  exportBlacklist(): void {
    this.bulkExport();
  }

  trackByEntryId(index: number, entry: BlacklistEntry): string {
    return entry.id;
  }

  getAutomaticIconName(isAutomatic: boolean): string {
    return isAutomatic ? 'bot' : 'user';
  }

  manageAutoRules(): void {
    this.toastr.info('Auto rules management coming soon');
  }

  editEntry(entry: BlacklistEntry): void {
    this.blacklistForm.patchValue({
      targetType: entry.targetType.toLowerCase(),
      targetValue: entry.targetValue,
      category: entry.category.toLowerCase(),
      riskLevel: entry.riskLevel.toLowerCase(),
      reason: entry.reason,
      expiryDate: entry.expiryDate ? entry.expiryDate.toString().split('T')[0] : '',
      associatedEmail: entry.associatedEmail || '',
      notes: entry.notes || ''
    });
    
    this.showEditModal = true;
  }

  viewIncidentHistory(entry: BlacklistEntry): void {
    this.blacklistService.getIncidentHistory(entry.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.incidentHistory = history;
          this.showIncidentHistoryModal = true;
        },
        error: (error) => {
          this.toastr.error('Failed to load incident history');
          console.error('Error loading incident history:', error);
        }
      });
  }

  extendBan(entry: BlacklistEntry): void {
    const date = prompt("Enter new expiry date (YYYY-MM-DD):");
    if (date) {
      const newExpiryDate = new Date(date);
      this.blacklistService.extendBan(entry.id, newExpiryDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Ban extended successfully');
            this.loadData();
          },
          error: (error) => {
            this.toastr.error('Failed to extend ban');
            console.error('Error extending ban:', error);
          }
        });
    }
  }

  getAffectedAccounts(): number {
    const targetValue = this.blacklistForm.get('targetValue')?.value;
    if (!targetValue) return 0;

    // In a real implementation, this would make an API call to check impact
    // For now, return a mock value based on target type
    const targetType = this.blacklistForm.get('targetType')?.value;
    switch (targetType) {
      case 'ip':
        return Math.floor(Math.random() * 5) + 2; // 2-6 accounts
      case 'device':
        return Math.floor(Math.random() * 3) + 1; // 1-3 accounts
      default:
        return 1;
    }
  }

  getRelatedEntries(): number {
    const targetValue = this.blacklistForm.get('targetValue')?.value;
    if (!targetValue) return 0;

    // In a real implementation, this would make an API call to find related entries
    // For now, return a mock value
    return Math.floor(Math.random() * 3);
  }

  getRiskScore(): number {
    const riskLevel = this.blacklistForm.get('riskLevel')?.value;
    const scores = { 
      low: 25, 
      medium: 50, 
      high: 75, 
      critical: 95 
    };
    return scores[riskLevel as keyof typeof scores] || 50;
  }

  previewBlacklist(): void {
    if (this.blacklistForm.valid) {
      const formValue = this.blacklistForm.value;
      this.toastr.info(`Impact preview for ${formValue.targetValue}:
        - Affected Accounts: ${this.getAffectedAccounts()}
        - Related Entries: ${this.getRelatedEntries()}
        - Risk Score: ${this.getRiskScore()}%`);
    } else {
      this.toastr.warning('Please fill in required fields first');
    }
  }
}
