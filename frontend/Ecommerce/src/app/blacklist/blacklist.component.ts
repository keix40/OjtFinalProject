import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, HostListener } from "@angular/core";
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ReactiveFormsModule } from "@angular/forms";
import { BlacklistService, BlacklistEntry, BlacklistStats, AutoRules, Appeal } from "../services/blacklist.service";
import { Subject, forkJoin, of, Observable } from 'rxjs';
import { takeUntil, catchError, debounceTime, distinctUntilChanged, timeout } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';

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
  public PermissionConstants = PermissionConstants;
  // Data properties
  filteredEntries: BlacklistEntry[] = [];
  paginatedEntries: BlacklistEntry[] = [];
  selectedEntries: string[] = [];
  selectedEntryDetails: BlacklistEntry | null = null;
  stats: BlacklistStats | null = null;
  showEditModal = false;
  showIncidentHistoryModal = false;
  incidentHistory: any[] = [];
  relatedAccounts: any[] = [];

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
  pendingAppeals: number = 0;
  avgAppealTime: number = 0;
  activeTab: string = 'overview';
  Math = Math;
  
  // Get current date for date inputs
  get currentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Appeal management properties
  appeals: Appeal[] = [];
  selectedAppeal: Appeal | null = null;
  showAppealModal = false;
  showAppealManagementModal = false;
  appealReviewForm: FormGroup;
  loadingAppeals = false;
  loadingAppealReview = false;
  appealStatusFilter = '';
  filteredAppeals: Appeal[] = [];
  isEditMode = false;

  // Dropdown menu properties
  openMenuId: string | null = null;
  dropdownPosition = { x: 0, y: 0 };
  showBulkActionsDropdown = false;

  // Computed properties for appeal counts
  get approvedAppealsCount(): number {
    return this.appeals.filter(a => a.status === 'APPROVED').length;
  }

  get rejectedAppealsCount(): number {
    return this.appeals.filter(a => a.status === 'REJECTED').length;
  }

  // Form
  blacklistForm: FormGroup;
  editingEntryId: string | null = null;
  showExtendBanModal = false;
  extendingEntry: BlacklistEntry | null = null;
  extendBanForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private blacklistService: BlacklistService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    public permissionService: PermissionService
  ) {
    this.PermissionConstants = PermissionConstants;
    this.permissionService = permissionService;
    this.blacklistForm = this.fb.group({
      targetType: ["", Validators.required], // Remove default value
      targetValue: ["", Validators.required],
      category: ["", Validators.required], // Remove default value
      riskLevel: ["", Validators.required], // Remove default value
      reason: ["", Validators.required],
      expiryDate: [""],
      associatedEmail: ["", [Validators.email]],
      notes: [""],
      notifyTeam: [true],
      blockRelated: [false],
    });

    // Initialize extend ban form
    this.extendBanForm = this.fb.group({
      newExpiryDate: ['', Validators.required],
      reason: ['', Validators.required]
    });

    // Initialize appeal review form
    this.appealReviewForm = this.fb.group({
      decision: ['', [Validators.required]],
      adminNotes: ['', [Validators.required, Validators.minLength(10)]]
    });

    // Add form validation listeners
    this.appealReviewForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadAutoRules();
    this.loadAppeals(); // Load appeals for the appeals tab
    // Remove static mock values - these will come from backend stats
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
    // Ensure body scroll is restored
    this.enableBodyScroll();
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
        console.log('[BlacklistComponent] Stats received:', stats);
        console.log('[BlacklistComponent] Trends data:', stats?.trends);
        this.stats = stats;
        
        // Set dashboard stats from backend response
        if (stats) {
          this.fraudPrevented = stats.fraudPrevented || 0;
          this.pendingAppeals = stats.pendingAppeals || 0;
          this.avgAppealTime = stats.avgAppealTime || 0;
        }
        
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
    this.blacklistForm.reset();
    this.isEditMode = false;
    this.editingEntryId = null;
    this.relatedAccounts = [];
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.blacklistForm.reset();
    this.isEditMode = false;
    this.editingEntryId = null;
    this.relatedAccounts = [];
    this.showEditModal = false;
    this.cdr.markForCheck();
  }

  closeIncidentHistoryModal(): void {
    this.showIncidentHistoryModal = false;
  }

  addToBlacklist(): void {
    if (this.blacklistForm.valid) {
      const formValue = this.blacklistForm.value;
      
      // Create the blacklist entry data
      const entryData = {
        targetType: formValue.targetType ? formValue.targetType.toUpperCase() : undefined,
        targetValue: formValue.targetValue,
        category: formValue.category ? formValue.category.toUpperCase() : undefined,
        riskLevel: formValue.riskLevel ? formValue.riskLevel.toUpperCase() : undefined,
        reason: formValue.reason,
        expiryDate: formValue.expiryDate ? new Date(formValue.expiryDate) : undefined,
        associatedEmail: formValue.associatedEmail,
        notes: formValue.notes
        // addedBy will be set automatically by backend to current authenticated user
      };

      if (this.isEditMode && this.editingEntryId) {
        // Update existing entry
        this.blacklistService.updateEntry(this.editingEntryId, entryData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              console.log('[BlacklistComponent] Entry updated:', response);
              this.toastr.success('Entry updated successfully');
              this.loadData();
              this.resetForm();
            },
            error: (error) => {
              this.toastr.error('Failed to update entry');
              console.error('Error updating entry:', error);
            }
          });
      } else {
        // Add new entry
        this.blacklistService.addEntry(entryData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (mainResponse) => {
              console.log('[BlacklistComponent] Main entry added:', mainResponse);
              
              // If "Block related accounts" is checked, find and block related accounts
              if (formValue.blockRelated) {
                this.blockRelatedAccounts(formValue.targetType?.toUpperCase(), formValue.targetValue, formValue.reason);
              } else {
                this.toastr.success('Entry added to blacklist successfully');
                this.loadData();
                this.resetForm();
              }
            },
            error: (error) => {
              this.toastr.error('Failed to add entry to blacklist');
              console.error('Error adding entry:', error);
            }
          });
      }
    }
  }

  private blockRelatedAccounts(targetType: string, targetValue: string, reason: string): void {
    console.log('[BlacklistComponent] Blocking related accounts for:', targetType, targetValue);
    
    // Find related accounts based on target type
    this.findRelatedAccounts(targetType, targetValue).subscribe({
      next: (relatedAccounts) => {
        if (relatedAccounts.length > 0) {
          console.log('[BlacklistComponent] Found related accounts:', relatedAccounts);
          
          // Add related accounts to blacklist
          const relatedEntries = relatedAccounts.map(account => ({
            targetType: 'EMAIL' as const, // Use uppercase to match backend enum
            targetValue: account.email,
            category: 'POLICY_VIOLATION' as const, // Use uppercase to match backend enum
            riskLevel: 'MEDIUM' as const, // Use uppercase to match backend enum
            reason: `Related account to ${targetValue}: ${reason}`,
            expiryDate: undefined, // Same expiry as main entry
            associatedEmail: targetValue,
            notes: `Automatically blocked due to relationship with ${targetValue}`
            // addedBy will be set automatically by backend to current authenticated user
          }));

          // Add all related entries
          let completed = 0;
          relatedEntries.forEach(entry => {
            this.blacklistService.addEntry(entry)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  completed++;
                  if (completed === relatedEntries.length) {
                    this.toastr.success(`Entry and ${relatedEntries.length} related accounts added to blacklist`);
                    this.loadData();
                    this.blacklistForm.reset();
                    this.showEditModal = false;
                    this.cdr.markForCheck();
                  }
                },
                error: (error) => {
                  console.error('[BlacklistComponent] Error adding related entry:', error);
                  completed++;
                  if (completed === relatedEntries.length) {
                    this.toastr.warning('Main entry added, but some related accounts failed to block');
                    this.loadData();
                    this.blacklistForm.reset();
                    this.showEditModal = false;
                    this.cdr.markForCheck();
                  }
                }
              });
          });
        } else {
          this.toastr.success('Entry added to blacklist successfully (no related accounts found)');
          this.loadData();
          this.blacklistForm.reset();
          this.showEditModal = false;
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('[BlacklistComponent] Error finding related accounts:', error);
        this.toastr.warning('Main entry added, but failed to check for related accounts');
        this.loadData();
        this.blacklistForm.reset();
        this.showEditModal = false;
        this.cdr.markForCheck();
      }
    });
  }

  private findRelatedAccounts(targetType: string, targetValue: string): Observable<any[]> {
    // Call backend API to find related accounts
    return this.blacklistService.findRelatedAccounts(targetType, targetValue);
  }

  // Similar updates for other methods that modify state
  liftBan(entry: BlacklistEntry): void {
    console.log('[BlacklistComponent] liftBan called for entry:', entry);
    console.log('[BlacklistComponent] Entry ID:', entry.id);
    console.log('[BlacklistComponent] Entry targetValue:', entry.targetValue);
    
    if (confirm(`Lift ban for ${entry.targetValue}?`)) {
      console.log('[BlacklistComponent] User confirmed lift ban');
      this.blacklistService.liftBan(entry.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('[BlacklistComponent] Lift ban successful:', response);
            this.toastr.success('Ban lifted successfully');
            this.loadData();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('[BlacklistComponent] Lift ban error:', error);
            this.toastr.error('Failed to lift ban');
            console.error('Error lifting ban:', error);
          }
        });
    } else {
      console.log('[BlacklistComponent] User cancelled lift ban');
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
    console.log('[BlacklistComponent] bulkLiftBan called with selected entries:', this.selectedEntries);
    if (confirm(`Lift ban for ${this.selectedEntries.length} selected entries?`)) {
      this.blacklistService.bulkLiftBan(this.selectedEntries)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('[BlacklistComponent] Bulk lift ban successful');
            this.toastr.success('Bans lifted successfully');
            this.selectedEntries = [];
            this.showBulkActionsDropdown = false;
            this.loadData();
          },
          error: (error) => {
            console.error('[BlacklistComponent] Bulk lift ban error:', error);
            this.toastr.error('Failed to lift bans');
            console.error('Error lifting bans:', error);
          }
        });
    }
  }

  bulkExtendBan(): void {
    console.log('[BlacklistComponent] bulkExtendBan called with selected entries:', this.selectedEntries);
    const date = prompt("Enter new expiry date (YYYY-MM-DD):");
    if (date) {
      const newExpiryDate = new Date(date);
      // Validate date
      if (isNaN(newExpiryDate.getTime())) {
        this.toastr.error('Invalid date format. Please use YYYY-MM-DD format.');
        return;
      }
      // Check if date is in the future
      if (newExpiryDate <= new Date()) {
        this.toastr.error('Expiry date must be in the future.');
        return;
      }
      
      console.log('[BlacklistComponent] Extending bans with date:', newExpiryDate);
      this.blacklistService.bulkExtendBan(this.selectedEntries, newExpiryDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('[BlacklistComponent] Bulk extend ban successful');
            this.toastr.success('Bans extended successfully');
            this.selectedEntries = [];
            this.showBulkActionsDropdown = false;
            this.loadData();
          },
          error: (error) => {
            console.error('[BlacklistComponent] Bulk extend ban error:', error);
            this.toastr.error('Failed to extend bans');
            console.error('Error extending bans:', error);
          }
        });
    }
  }

  bulkUpdateCategory(): void {
    console.log('[BlacklistComponent] bulkUpdateCategory called with selected entries:', this.selectedEntries);
    const validCategories = ['fraud', 'spam', 'abuse', 'chargeback', 'fake_account', 'policy_violation'];
    const category = prompt(`Enter new category (${validCategories.join('/')}):`);
    if (category) {
      const normalizedCategory = category.toLowerCase().replace(' ', '_');
      console.log('[BlacklistComponent] Normalized category:', normalizedCategory);
      if (validCategories.includes(normalizedCategory)) {
        this.blacklistService.bulkUpdateCategory(this.selectedEntries, normalizedCategory)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              console.log('[BlacklistComponent] Bulk update category successful');
              this.toastr.success('Categories updated successfully');
              this.selectedEntries = [];
              this.showBulkActionsDropdown = false;
              this.loadData();
            },
            error: (error) => {
              console.error('[BlacklistComponent] Bulk update category error:', error);
              this.toastr.error('Failed to update categories');
              console.error('Error updating categories:', error);
            }
          });
      } else {
        this.toastr.error(`Invalid category. Please use one of: ${validCategories.join(', ')}`);
      }
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
        this.showBulkActionsDropdown = false;
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
    // Reset target value when target type changes
    this.blacklistForm.patchValue({ targetValue: '' });
    
    // Update validation based on target type
    const targetType = this.blacklistForm.get('targetType')?.value;
    const targetValueControl = this.blacklistForm.get('targetValue');
    
    if (targetValueControl) {
      // Clear existing validators
      targetValueControl.clearValidators();
      
      // Add appropriate validators based on target type
      switch (targetType) {
        case 'email':
          targetValueControl.setValidators([Validators.required, Validators.email]);
          break;
        case 'ip':
          targetValueControl.setValidators([Validators.required, this.ipAddressValidator()]);
          break;
        case 'phone':
          targetValueControl.setValidators([Validators.required, this.phoneNumberValidator()]);
          break;
        default:
          targetValueControl.setValidators([Validators.required]);
      }
      
      targetValueControl.updateValueAndValidity();
    }
  }

  // Custom validators
  private ipAddressValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      return ipRegex.test(control.value) ? null : { invalidIp: true };
    };
  }

  private phoneNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(control.value) ? null : { invalidPhone: true };
    };
  }

  loadRelatedAccounts(): void {
    const targetValue = this.blacklistForm.get('targetValue')?.value;
    const targetType = this.blacklistForm.get('targetType')?.value;
    const blockRelated = this.blacklistForm.get('blockRelated')?.value;

    if (targetValue && targetType && blockRelated) {
      console.log('[BlacklistComponent] Loading related accounts for:', targetType, targetValue);
      
      this.blacklistService.findRelatedAccounts(targetType, targetValue)
        .pipe(
          takeUntil(this.destroy$),
          timeout(5000), // 5 seconds timeout
          catchError(error => {
            console.error('[BlacklistComponent] Error loading related accounts:', error);
            this.relatedAccounts = [];
            return of([]); // Return empty array to continue
          })
        )
        .subscribe({
          next: (accounts) => {
            console.log('[BlacklistComponent] Related accounts found:', accounts);
            this.relatedAccounts = accounts || [];
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('[BlacklistComponent] Error loading related accounts:', error);
            this.relatedAccounts = [];
            this.cdr.markForCheck();
          }
        });
    } else {
      this.relatedAccounts = [];
      this.cdr.markForCheck();
    }
  }

  getTargetPlaceholder(): string {
    const targetType = this.blacklistForm.get("targetType")?.value;
    const placeholders = {
      email: "user@example.com",
      ip: "192.168.1.1",
      phone: "+1234567890",
    };
    return placeholders[targetType as keyof typeof placeholders] || "Enter target value";
  }

  // Utility methods for icons and labels
  getTargetIconName(targetType: string): string {
    switch (targetType?.toLowerCase()) {
      case 'email': return 'mail';
      case 'ip': return 'globe';
      case 'phone': return 'phone';
      default: return 'user';
    }
  }

  getTargetTypeLabel(targetType: string): string {
    const labels = {
      email: "Email Address",
      ip: "IP Address",
      phone: "Phone Number",
    };
    return labels[targetType?.toLowerCase() as keyof typeof labels] || targetType;
  }

  getCategoryIconName(category: string): string {
    switch (category?.toUpperCase()) {
      case 'FRAUD': return 'alert-triangle';
      case 'SPAM': return 'message-circle';
      case 'ABUSE': return 'slash';
      case 'CHARGEBACK': return 'credit-card';
      case 'FAKE_ACCOUNT': return 'user-x';
      case 'POLICY_VIOLATION': return 'file-warning';
      default: return 'alert-circle';
    }
  }

  getCategoryLabel(category: string): string {
    const labels = {
      FRAUD: "Fraud",
      SPAM: "Spam",
      ABUSE: "Abuse",
      CHARGEBACK: "Chargeback",
      FAKE_ACCOUNT: "Fake Account",
      POLICY_VIOLATION: "Policy Violation",
    };
    return labels[category?.toUpperCase() as keyof typeof labels] || category;
  }

  getRiskIconName(riskLevel: string): string {
    switch (riskLevel?.toUpperCase()) {
      case 'CRITICAL': return 'flame';
      case 'HIGH': return 'trending-up';
      case 'MEDIUM': return 'activity';
      case 'LOW': return 'shield';
      default: return 'help-circle';
    }
  }

  getStatusIconName(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'lock';
      case 'APPEALED': return 'clock';
      case 'EXPIRED': return 'calendar-x';
      case 'LIFTED': return 'unlock';
      default: return 'help-circle';
    }
  }

  getStatusLabel(status: string): string {
    const statuses: { [key: string]: string } = {
      'ACTIVE': 'Active',
      'active': 'Active',
      'EXPIRED': 'Expired',
      'expired': 'Expired',
      'LIFTED': 'Lifted',
      'lifted': 'Lifted',
      'APPEALED': 'Under Appeal',
      'appealed': 'Under Appeal',
      'PENDING': 'Pending',
      'pending': 'Pending',
      'APPROVED': 'Approved',
      'approved': 'Approved',
      'REJECTED': 'Rejected',
      'rejected': 'Rejected'
    };
    return statuses[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'ACTIVE': 'red',
      'active': 'red',
      'EXPIRED': 'gray',
      'expired': 'gray',
      'LIFTED': 'green',
      'lifted': 'green',
      'APPEALED': 'orange',
      'appealed': 'orange',
      'PENDING': 'yellow',
      'pending': 'yellow',
      'APPROVED': 'green',
      'approved': 'green',
      'REJECTED': 'red',
      'rejected': 'red'
    };
    return colors[status] || 'gray';
  }

  // Helper method to normalize status values
  normalizeStatus(status: string): string {
    return status.toUpperCase();
  }

  // Check if entry has appeals
  hasAppeals(entry: BlacklistEntry): boolean {
    return this.appeals.some(appeal => appeal.blacklistEntryId === entry.id);
  }

  // Get appeals for specific entry
  getEntryAppeals(entry: BlacklistEntry): Appeal[] {
    return this.appeals.filter(appeal => appeal.blacklistEntryId === entry.id);
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
    this.editingEntryId = entry.id;
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
    this.isEditMode = true;
    this.cdr.detectChanges();
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
    this.extendingEntry = entry;
    this.extendBanForm.patchValue({
      newExpiryDate: entry.expiryDate ? entry.expiryDate.toString().split('T')[0] : '',
      reason: '' // Reason will be added by user
    });
    this.showExtendBanModal = true;
    this.cdr.detectChanges();
  }

  submitExtendBan(): void {
    if (this.extendBanForm.valid && this.extendingEntry) {
      const formValue = this.extendBanForm.value;
      const newExpiryDate = new Date(formValue.newExpiryDate);
      
      this.blacklistService.extendBan(this.extendingEntry.id, newExpiryDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Ban extended successfully');
            this.loadData();
            this.closeExtendBanModal();
          },
          error: (error) => {
            this.toastr.error('Failed to extend ban');
            console.error('Error extending ban:', error);
          }
        });
    }
  }

  closeExtendBanModal(): void {
    this.showExtendBanModal = false;
    this.extendingEntry = null;
    this.extendBanForm.reset();
    this.cdr.detectChanges();
  }

  getAffectedAccounts(): number {
    const targetValue = this.blacklistForm.get('targetValue')?.value;
    if (!targetValue) return 0;

    // Simple static values for demo purposes
    // In a real project, this would be calculated based on actual data
    return 1; // Most blacklist entries affect 1 account
  }

  getRelatedEntries(): number {
    return this.relatedAccounts.length;
  }

  // Appeal management methods
  loadAppeals(): void {
    this.loadingAppeals = true;
    console.log('Loading appeals...');
    
    this.blacklistService.getAppeals().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading appeals:', error);
        // Show user-friendly error message
        const errorMessage = error.error?.message || error.message || 'Failed to load appeals';
        this.toastr.error(errorMessage, 'Load Failed');
        this.loadingAppeals = false;
        this.cdr.detectChanges();
        return of([]);
      })
    ).subscribe({
      next: (appeals) => {
        console.log('Appeals loaded successfully:', appeals);
        this.appeals = appeals;
        this.pendingAppeals = appeals.filter(a => a.status === 'PENDING').length;
        this.filteredAppeals = appeals; // Initialize filtered appeals
        this.loadingAppeals = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Unexpected error in loadAppeals:', error);
        this.loadingAppeals = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewAppeal(appeal: Appeal): void {
    this.selectedAppeal = appeal;
    this.showAppealModal = true;
    this.isEditMode = false;
    this.showAppealManagementModal = false; // Hide management modal when opening review
    // Patch form with current values
    this.appealReviewForm.patchValue({
      decision: appeal.status === 'PENDING' ? '' : appeal.status,
      adminNotes: appeal.adminNotes || ''
    });
    this.cdr.detectChanges();
  }

  closeAppealModal(): void {
    this.selectedAppeal = null;
    this.showAppealModal = false;
    this.isEditMode = false;
    this.appealReviewForm.reset();
    this.showAppealManagementModal = true; // Optionally re-open management modal
    this.cdr.detectChanges();
  }

  enableEditMode(): void {
    this.isEditMode = true;
    this.cdr.detectChanges();
  }

  reviewAppeal(): void {
    console.log('Reviewing appeal, form valid:', this.appealReviewForm.valid);
    console.log('Selected appeal:', this.selectedAppeal);
    
    if (this.appealReviewForm.valid && this.selectedAppeal) {
      this.loadingAppealReview = true;
      const reviewData = this.appealReviewForm.value;
      
      console.log('Reviewing appeal:', this.selectedAppeal.id);
      console.log('Review data:', reviewData);
      
      this.blacklistService.reviewAppeal(this.selectedAppeal.id, reviewData).pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error reviewing appeal:', error);
          // Show user-friendly error message
          const errorMessage = error.error?.message || error.message || 'Failed to review appeal';
          this.toastr.error(errorMessage, 'Review Failed');
          this.loadingAppealReview = false;
          this.cdr.detectChanges();
          return of(null);
        })
      ).subscribe({
        next: (result) => {
          console.log('Appeal review result:', result);
          if (result) {
            this.toastr.success('Appeal reviewed successfully');
            // Update selectedAppeal with new data and lock again
            this.selectedAppeal = result;
            this.isEditMode = false;
            this.appealReviewForm.patchValue({
              decision: result.status,
              adminNotes: result.adminNotes || ''
            });
            this.loadAppeals();
            this.loadData(); // Refresh blacklist data
          }
          this.loadingAppealReview = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Unexpected error in reviewAppeal:', error);
          this.loadingAppealReview = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      console.log('Form is invalid or no appeal selected');
      if (!this.appealReviewForm.valid) {
        console.log('Form errors:', this.appealReviewForm.errors);
        console.log('Decision field errors:', this.appealReviewForm.get('decision')?.errors);
        console.log('Admin notes field errors:', this.appealReviewForm.get('adminNotes')?.errors);
        this.toastr.error('Please fill in all required fields', 'Form Error');
      }
    }
  }

  getAppealReasonLabel(reason: string): string {
    const reasons: { [key: string]: string } = {
      'WRONGFUL_BAN': 'Wrongful Ban',
      'MISTAKEN_IDENTITY': 'Mistaken Identity',
      'ACCOUNT_COMPROMISED': 'Account Compromised',
      'TECHNICAL_ERROR': 'Technical Error',
      'OTHER': 'Other'
    };
    return reasons[reason] || reason;
  }

  getAppealStatusLabel(status: string): string {
    const statuses: { [key: string]: string } = {
      'PENDING': 'Pending',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected'
    };
    return statuses[status] || status;
  }

  getAppealStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': 'yellow',
      'APPROVED': 'green',
      'REJECTED': 'red'
    };
    return colors[status] || 'gray';
  }

  // Helper method to get user email from appeal
  getAppealUserEmail(appeal: Appeal): string {
    return appeal.userEmail || 'Unknown';
  }

  // Helper method to get appeal details
  getAppealDetails(appeal: Appeal): string {
    return appeal.appealDetails || 'No details provided';
  }

  // Method to view all appeals
  viewAllAppeals(): void {
    // Set active tab to appeals if in entry details view
    this.activeTab = 'appeals';
    // Load appeals if not already loaded
    if (this.appeals.length === 0) {
      this.loadAppeals();
    }
  }

  // Appeal management modal methods
  openAppealManagementModal(): void {
    console.log('Opening appeal management modal');
    this.showAppealManagementModal = true;
    this.loadAppeals();
    this.disableBodyScroll();
    this.cdr.detectChanges();
  }

  closeAppealManagementModal(): void {
    console.log('Closing appeal management modal');
    this.showAppealManagementModal = false;
    this.appealStatusFilter = '';
    this.filteredAppeals = [];
    this.enableBodyScroll();
    this.cdr.detectChanges();
  }

  filterAppeals(): void {
    if (!this.appealStatusFilter) {
      this.filteredAppeals = this.appeals;
    } else {
      this.filteredAppeals = this.appeals.filter(appeal => appeal.status === this.appealStatusFilter);
    }
    this.cdr.detectChanges();
  }

  // Utility methods for dropdown menu
  openMenu(id: string): void {
    this.openMenuId = id;
    this.cdr.detectChanges();
    
    // After the dropdown is rendered, adjust its position if needed
    setTimeout(() => {
      this.adjustDropdownPosition(id);
    }, 0);
  }

  closeMenu(): void {
    this.openMenuId = null;
    this.cdr.detectChanges();
  }

  toggleMenu(id: string): void {
    if (this.openMenuId === id) {
      this.closeMenu();
    } else {
      this.openMenu(id);
    }
  }

  // Adjust dropdown position to prevent clipping
  private adjustDropdownPosition(id: string): void {
    const button = document.getElementById(`menu-button-${id}`);
    
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 192; // w-48 = 12rem = 192px
      const dropdownHeight = 160; // Approximate height of dropdown with 4 items
      
      let x = buttonRect.right - dropdownWidth;
      let y = buttonRect.bottom + 8; // 8px gap below button
      
      // Ensure dropdown doesn't go off the right edge
      if (x < 0) {
        x = 8; // 8px from left edge
      }
      
      // Check if dropdown would be cut off at the bottom
      if (y + dropdownHeight > viewportHeight) {
        // Position dropdown above the button
        y = buttonRect.top - dropdownHeight - 8; // 8px gap above button
      }
      
      // Ensure dropdown doesn't go off the top edge
      if (y < 0) {
        y = 8; // 8px from top edge
      }
      
      this.dropdownPosition = { x, y };
      this.cdr.detectChanges();
    }
  }

  // Click outside handler for dropdown menu
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.openMenuId && !target.closest(`[id="menu-button-${this.openMenuId}"]`)) {
      this.closeMenu();
    }
    // Close bulk actions dropdown if clicking outside
    if (this.showBulkActionsDropdown && !target.closest('.bulk-actions')) {
      this.showBulkActionsDropdown = false;
    }
  }

  // Toggle bulk actions dropdown
  toggleBulkActionsDropdown(): void {
    this.showBulkActionsDropdown = !this.showBulkActionsDropdown;
    this.cdr.detectChanges();
  }

  getTrendIcon(direction: string | undefined): string {
    switch (direction) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
      default:
        return 'minus';
    }
  }

  // Helper methods for body scroll management
  private disableBodyScroll(): void {
    document.body.classList.add('modal-open');
  }

  private enableBodyScroll(): void {
    document.body.classList.remove('modal-open');
  }

  // Number formatting methods with thousand separators
  formatNumberWithSeparator(value: number): string {
    if (value === null || value === undefined) return '0';
    return Math.round(value).toLocaleString('en-US');
  }

  formatDecimalWithSeparator(value: number, decimals: number = 2): string {
    if (value === null || value === undefined) return '0.00';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  formatCurrencyWithSeparator(value: number, currency: string = 'MMK'): string {
    if (value === null || value === undefined) return `0 ${currency}`;
    const formatted = Math.round(value).toLocaleString('en-US');
    return `${formatted} ${currency}`;
  }

  // Modal scroll helper methods
  scrollModalToTop(): void {
    const modalContent = document.querySelector('.scrollbar-hide') as HTMLElement;
    if (modalContent) {
      modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  scrollModalToBottom(): void {
    const modalContent = document.querySelector('.scrollbar-hide') as HTMLElement;
    if (modalContent) {
      modalContent.scrollTo({ top: modalContent.scrollHeight, behavior: 'smooth' });
    }
  }
}
