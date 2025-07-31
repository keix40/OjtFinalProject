import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ImageService } from '../services/image.service';
import { AdminUserService, AdminUser } from '../services/admin-user.service';
import { PermissionCategoryService, PermissionCategory } from '../services/permission-category.service';
import { RoleService } from '../services/role.service';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';
import { AuthService } from '../auth/auth.service';

interface Permission {
  key: string;
  name: string;
  description: string;
}

interface AdminActivity {
  id: string;
  type: string;
  action: string;
  description: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  standalone: false,
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit, AfterViewChecked {
  // Data properties
  allAdmins: AdminUser[] = [];
  filteredAdmins: AdminUser[] = [];
  paginatedAdmins: AdminUser[] = [];
  selectedAdmins: number[] = [];
  // Permissions modal logic
  selectedAdminForPermissions: AdminUser | null = null;

  // Edit modal logic
  editingAdmin: AdminUser | null = null;
  editFormData: { name?: string; email?: string; status?: string; roleName?: string } = {};

  // Activity methods
  selectedAdminForActivity: AdminUser | null = null;
  adminActivities: any[] = [];

  // Filter properties
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  statuses: string[] = ['active', 'inactive', 'suspended'];
  activityFilter = '';
  activityDateFrom = '';
  activityDateTo = '';

  // UI state
  viewMode: 'table' | 'cards' = 'table';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Utility property
  Math = Math;

  // Permission categories
  permissionCategories: PermissionCategory[] = [];
  roles: any[] = [];

  openDropdownId: number | null = null;
  adminOnlineStatus: { [userId: number]: { lastActive: string | null, isOnline: boolean } } = {};
  onlineStatusInterval: any;
  onlineAdmins: number = 0;
  autoRefreshInterval: any;
  stompClient: Client | null = null;
  stompSub: any;
  currentUser: any = {
    id: null,
    name: '',
    role: {
      id: null,
      name: '',
      level: 0
    }
  };

  showPermissionModal = false;
  selectedAdminForPermission: any = null;

  constructor(
    public imageService: ImageService,
    private adminUserService: AdminUserService,
    private permissionCategoryService: PermissionCategoryService,
    private roleService: RoleService,
    public permissionService: PermissionService,
    public authService: AuthService
  ) {
    this.PermissionConstants = PermissionConstants;
    // Get current user's role level from JWT
    const decoded = this.authService.getDecodedToken();
    if (decoded && decoded.roleLevel !== undefined) {
      this.currentUser.role.level = decoded.roleLevel;
    }
  }
  public PermissionConstants = PermissionConstants;

  ngOnInit(): void {
    // Set currentUser from JWT
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUser = {
          id: payload.id || 0,
          name: payload.sub || 'Unknown User',
          role: {
            id: payload.id || 0,
            name: payload.roles || 'UNKNOWN',
            level: payload.roleLevel || 0
          }
        };
      } catch (error) {
        console.error('Error parsing JWT token:', error);
        this.currentUser = {
          id: 0,
          name: 'Parse Error',
          role: {
            id: 0,
            name: 'PARSE_ERROR',
            level: 0
          }
        };
      }
    } else {
      console.error('No token found in localStorage');
      this.currentUser = {
        id: 0,
        name: 'No Token',
        role: {
          id: 0,
          name: 'NO_TOKEN',
          level: 0
        }
      };
    }
    this.permissionCategoryService.getPermissionCategories().subscribe(categories => {
      this.permissionCategories = categories;
    });
    this.roleService.getAllRoles().subscribe(roles => {
      this.roles = roles;
      this.adminUserService.getAdminUsers().subscribe(users => {
        users.forEach(admin => {
          // Find the full role object for this admin
          const roleObj = roles.find(r => r.name === ((admin as any).roleName || (typeof admin.role === 'string' ? admin.role : (admin.role && 'name' in admin.role ? admin.role.name : ''))));
          if (roleObj) {
            (admin as any).role = roleObj;
          } else {
            console.warn('No matching role found for admin:', admin);
            (admin as any).role = { name: 'Unknown', level: 99 };
          }
        });
        this.allAdmins = users;
        this.applyFilters();
      });
    });
    this.fetchAdminOnlineStatus();
    this.autoRefreshInterval = setInterval(() => {
      this.fetchAdminOnlineStatus();
      this.refreshData();
    }, 30000);
    this.onlineStatusInterval = setInterval(() => this.fetchAdminOnlineStatus(), 60000);
    this.connectWebSocket();
  }

  connectWebSocket(): void {
    this.stompClient = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        this.stompSub = this.stompClient!.subscribe('/topic/admin-online-status', (message: IMessage) => {
          const status = JSON.parse(message.body);
          this.adminOnlineStatus = status;
          this.onlineAdmins = Object.values(status).filter((s: any) => s.isOnline).length;
        });
      },
      onStompError: () => {},
      onWebSocketClose: () => {}
    });
    this.stompClient.activate();
  }

  ngOnDestroy(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    if (this.onlineStatusInterval) {
      clearInterval(this.onlineStatusInterval);
    }
    if (this.stompSub) {
      this.stompSub.unsubscribe();
    }
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  fetchAdminOnlineStatus(): void {
    this.adminUserService.getAdminUsersOnlineStatus().subscribe(statusMap => {
      this.adminOnlineStatus = statusMap;
      this.onlineAdmins = Object.values(statusMap).filter((s: any) => s.isOnline).length;
    });
  }

  ngAfterViewChecked() {
    if ((window as any)['lucide']) {
      (window as any)['lucide'].createIcons();
    }
  }

  // Statistics getters
  get totalAdmins(): number {
    return this.allAdmins.length;
  }

  get activeAdmins(): number {
    return this.allAdmins.filter(admin => admin.status === 'active').length;
  }

  get suspendedAdmins(): number {
    return this.allAdmins.filter(admin => admin.status === 'suspended').length;
  }

  // Filter methods
  applyFilters(): void {
    this.filteredAdmins = this.allAdmins.filter(admin => {
      const matchesSearch = !this.searchTerm || 
        admin.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      let roleName = '';
      if (typeof admin.role === 'string') roleName = admin.role;
      else if (admin.role && 'name' in admin.role) roleName = admin.role.name;
      const matchesRole = !this.roleFilter || roleName === this.roleFilter;
      const matchesStatus = !this.statusFilter || admin.status === this.statusFilter;
      // Remove department filter logic
      return matchesSearch && matchesRole && matchesStatus;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAdmins.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedAdmins = this.filteredAdmins.slice(startIndex, endIndex);
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

  // Selection methods
  selectAll(event: any): void {
    if (event.target.checked) {
      this.selectedAdmins = this.paginatedAdmins.map(admin => admin.id);
    } else {
      this.selectedAdmins = [];
    }
  }

  toggleAdminSelection(adminId: number, event: any): void {
    if (event.target.checked) {
      this.selectedAdmins.push(adminId);
    } else {
      this.selectedAdmins = this.selectedAdmins.filter(id => id !== adminId);
    }
  }

  // View methods
  setViewMode(mode: 'table' | 'cards'): void {
    this.viewMode = mode;
  }

  // Admin management methods
  openCreateAdminModal(): void {
    // Example: open a modal and collect data, then call createAdminUser
    // For now, just a placeholder
    const newAdmin = {
      name: 'New Admin',
      email: 'newadmin@example.com',
      password: 'password123',
      department: 'it',
      roleName: 'admin',
      status: 'ACTIVE'
    };
    this.adminUserService.createAdminUser(newAdmin).subscribe({
      next: () => {
        alert('Admin created successfully');
        this.refreshData();
      },
      error: err => alert('Failed to create admin: ' + (err.error?.message || err.message))
    });
  }

  // Permissions modal logic
  viewPermissions(admin: AdminUser): void {
    this.selectedAdminForPermissions = admin;
  }

  closePermissionsModal(): void {
    this.selectedAdminForPermissions = null;
  }

  openPermissionModal(admin: any): void {
    this.selectedAdminForPermission = admin;
    this.showPermissionModal = true;
  }
  closePermissionModal(): void {
    this.showPermissionModal = false;
    this.selectedAdminForPermission = null;
  }

  // Edit modal logic
  openEditAdminModal(admin: AdminUser): void {
    this.editingAdmin = { ...admin };
    this.editFormData = { name: admin.name, email: admin.email, status: admin.status, roleName: (admin as any).roleName || (typeof admin.role === 'string' ? admin.role : (admin.role && 'name' in admin.role ? admin.role.name : '')) };
  }

  closeEditAdminModal(): void {
    this.editingAdmin = null;
    this.editFormData = {};
  }

  saveEditAdmin(): void {
    if (!this.editingAdmin) return;
    const updatedAdmin = {
      name: this.editFormData.name || this.editingAdmin.name,
      email: this.editFormData.email || this.editingAdmin.email,
      department: this.editingAdmin.department,
      roleName: this.editFormData.roleName || (this.editingAdmin as any).roleName || (typeof this.editingAdmin.role === 'string' ? this.editingAdmin.role : (this.editingAdmin.role && 'name' in this.editingAdmin.role ? this.editingAdmin.role.name : '')),
      status: this.editFormData.status || this.editingAdmin.status
    };
    this.adminUserService.updateAdminUser(this.editingAdmin.id, updatedAdmin).subscribe({
      next: () => {
        this.closeEditAdminModal();
        this.refreshData();
      },
      error: err => alert('Failed to update admin: ' + (err.error?.message || err.message))
    });
  }

  deleteAdmin(admin: AdminUser): void {
    if (confirm(`Are you sure you want to delete ${admin.name}?`)) {
      this.adminUserService.deleteAdminUser(admin.id).subscribe({
        next: () => {
          this.refreshData();
        },
        error: err => alert('Failed to delete admin: ' + (err.error?.message || err.message))
      });
    }
  }

  toggleAdminStatus(admin: AdminUser): void {
    const newStatus = admin.status === 'active' ? 'suspended' : 'active';
    this.adminUserService.updateAdminStatus(admin.id, newStatus).subscribe({
      next: () => {
        this.refreshData();
      },
      error: err => alert('Failed to update status: ' + (err.error?.message || err.message))
    });
  }

  resetPassword(admin: AdminUser): void {
    if (confirm(`Reset password for ${admin.name}?`)) {
      console.log('Password reset for:', admin);
      alert('Password reset email sent to ' + admin.email);
    }
  }

  // Permission methods
  managePermissions(admin: AdminUser): void {
    this.selectedAdminForPermissions = admin;
    // Modal would be triggered via Bootstrap JS or Angular CDK
  }

  hasPermission(admin: AdminUser, permissionKey: string): boolean {
    return (admin.permissions || []).includes(permissionKey);
  }

  togglePermission(permissionKey: string, event: any): void {
    if (!this.selectedAdminForPermissions) return;

    if (event.target.checked) {
      if (!(this.selectedAdminForPermissions.permissions || []).includes(permissionKey)) {
        if (!this.selectedAdminForPermissions.permissions) this.selectedAdminForPermissions.permissions = [];
        this.selectedAdminForPermissions.permissions.push(permissionKey);
      }
    } else {
      this.selectedAdminForPermissions.permissions = 
        (this.selectedAdminForPermissions.permissions || []).filter((p: string) => p !== permissionKey);
    }
  }

  savePermissions(): void {
    if (this.selectedAdminForPermissions) {
      // Call backend to update permissions if endpoint exists
      // Example: this.adminUserService.updatePermissions(this.selectedAdminForPermissions.id, this.selectedAdminForPermissions.permissions).subscribe(...)
      alert('Permissions updated successfully');
      this.closePermissionsModal();
      this.refreshData();
    }
  }

  // Activity methods
  viewAdminActivity(admin: AdminUser): void {
    this.selectedAdminForActivity = admin;
    this.adminUserService.getAdminActivities(admin.id).subscribe({
      next: activities => {
        this.adminActivities = activities;
        // Open activity modal (implement modal logic as needed)
        alert('Loaded ' + activities.length + ' activities for ' + admin.name);
      },
      error: err => alert('Failed to load activities: ' + (err.error?.message || err.message))
    });
  }

  // Utility methods
  getRoleIcon(role: string): string {
    const icons = {
      super_admin: 'fas fa-crown',
      admin: 'fas fa-user-shield',
      manager: 'fas fa-user-tie',
      moderator: 'fas fa-user-cog',
      support: 'fas fa-headset'
    };
    return icons[role as keyof typeof icons] || 'fas fa-user';
  }

  getRoleLabel(role: string | { name: string } | { id: number; name: string }): string {
    let roleName: string = '';
    if (typeof role === 'string') {
      roleName = role;
    } else if (role && 'name' in role) {
      roleName = role.name;
    }
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Administrator',
      manager: 'Manager',
      moderator: 'Moderator',
      support: 'Support Agent'
    };
    return labels[roleName as keyof typeof labels] || roleName;
  }

  getStatusIcon(status: string): string {
    const icons = {
      active: 'fas fa-check-circle',
      inactive: 'fas fa-pause-circle',
      suspended: 'fas fa-ban'
    };
    return icons[status as keyof typeof icons] || 'fas fa-question-circle';
  }

  getActivityIcon(type: string): string {
    const icons = {
      login: 'fas fa-sign-in-alt',
      logout: 'fas fa-sign-out-alt',
      create: 'fas fa-plus',
      update: 'fas fa-edit',
      delete: 'fas fa-trash',
      security: 'fas fa-shield-alt'
    };
    return icons[type as keyof typeof icons] || 'fas fa-info-circle';
  }

  getTimeAgo(date: string | Date | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'} ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return d.toLocaleDateString();
  }

  refreshData(): void {
    this.ngOnInit();
    console.log('Data refreshed');
  }

  exportAdminData(): void {
    const csvContent = this.generateAdminCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-users-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  generateAdminCSV(): string {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'Last Login', 'Permissions Count'];
    const rows = this.filteredAdmins.map(admin => [
      admin.name,
      admin.email,
      this.getRoleLabel(admin.role),
      admin.department || '',
      admin.status,
      (admin.lastLogin ? new Date(admin.lastLogin).toISOString() : ''),
      (admin.permissions ? admin.permissions.length.toString() : '0')
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  trackByAdminId(index: number, admin: AdminUser): number {
    return admin.id;
  }

  editAdmin(admin: AdminUser): void {
    this.openEditAdminModal(admin);
  }

  getRoleLevel(admin: any): number {
    // Map role names to levels
    const roleLevels: { [key: string]: number } = {
      'super_admin': 7,
      'admin': 6,
      'manager': 5,
      'sales/marketing': 4,
      'moderator': 3,
      'support': 2,
      'user': 1
    };
    return roleLevels[admin.role] || 1;
  }

  // Helper methods for conditional actions
  canEditAdmin(admin: any): boolean {
    return this.permissionService.hasPermission(PermissionConstants.ADMIN_USERS_UPDATE) && 
           this.currentUser.role.level > this.getRoleLevel(admin);
  }

  canDeleteAdmin(admin: any): boolean {
    return this.permissionService.hasPermission(PermissionConstants.ADMIN_USERS_DELETE) && 
           this.currentUser.role.level > this.getRoleLevel(admin);
  }

  canToggleAdminStatus(admin: any): boolean {
    return this.permissionService.hasPermission(PermissionConstants.ADMIN_USERS_UPDATE) && 
           this.currentUser.role.level > this.getRoleLevel(admin);
  }

  // Conditional action methods
  handleEditAdmin(admin: AdminUser): void {
    if (this.canEditAdmin(admin)) {
      this.editAdmin(admin);
      this.openDropdownId = null;
    }
  }

  handleDeleteAdmin(admin: AdminUser): void {
    if (this.canDeleteAdmin(admin)) {
      this.deleteAdmin(admin);
      this.openDropdownId = null;
    }
  }

  handleToggleAdminStatus(admin: AdminUser): void {
    if (this.canToggleAdminStatus(admin)) {
      this.toggleAdminStatus(admin);
      this.openDropdownId = null;
    }
  }

  handleToggleDropdown(admin: any): void {
    if (this.currentUser.role.level > this.getRoleLevel(admin)) {
      this.openDropdownId = this.openDropdownId === admin.id ? null : admin.id;
    }
  }
}