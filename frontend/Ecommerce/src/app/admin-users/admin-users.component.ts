import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ImageService } from '../services/image.service';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'super_admin' | 'admin' | 'manager' | 'moderator' | 'support';
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  isOnline: boolean;
  lastLogin: Date;
  permissions: string[];
  createdAt: Date;
  lastActivity: Date;
}

interface Permission {
  key: string;
  name: string;
  description: string;
}

interface PermissionCategory {
  name: string;
  icon: string;
  permissions: Permission[];
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
  selectedAdmins: string[] = [];
  selectedAdminForPermissions: AdminUser | null = null;
  selectedAdminForActivity: AdminUser | null = null;
  adminActivities: AdminActivity[] = [];
  openDropdownId: string | null = null;

  // Filter properties
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  departmentFilter = '';
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
  permissionCategories: PermissionCategory[] = [
    {
      name: 'User Management',
      icon: 'fas fa-users',
      permissions: [
        { key: 'users.view', name: 'View Users', description: 'View customer and user accounts' },
        { key: 'users.create', name: 'Create Users', description: 'Create new user accounts' },
        { key: 'users.edit', name: 'Edit Users', description: 'Modify user account information' },
        { key: 'users.delete', name: 'Delete Users', description: 'Delete user accounts' },
        { key: 'users.export', name: 'Export Users', description: 'Export user data' }
      ]
    },
    {
      name: 'Product Management',
      icon: 'fas fa-box',
      permissions: [
        { key: 'products.view', name: 'View Products', description: 'View product catalog' },
        { key: 'products.create', name: 'Create Products', description: 'Add new products' },
        { key: 'products.edit', name: 'Edit Products', description: 'Modify product information' },
        { key: 'products.delete', name: 'Delete Products', description: 'Remove products from catalog' },
        { key: 'products.pricing', name: 'Manage Pricing', description: 'Update product prices and discounts' }
      ]
    },
    {
      name: 'Order Management',
      icon: 'fas fa-shopping-cart',
      permissions: [
        { key: 'orders.view', name: 'View Orders', description: 'View customer orders' },
        { key: 'orders.edit', name: 'Edit Orders', description: 'Modify order details' },
        { key: 'orders.cancel', name: 'Cancel Orders', description: 'Cancel customer orders' },
        { key: 'orders.refund', name: 'Process Refunds', description: 'Issue refunds to customers' },
        { key: 'orders.export', name: 'Export Orders', description: 'Export order data' }
      ]
    },
    {
      name: 'Financial Operations',
      icon: 'fas fa-dollar-sign',
      permissions: [
        { key: 'finance.view', name: 'View Reports', description: 'View financial reports and analytics' },
        { key: 'finance.transactions', name: 'View Transactions', description: 'Access transaction history' },
        { key: 'finance.refunds', name: 'Process Refunds', description: 'Issue customer refunds' },
        { key: 'finance.export', name: 'Export Data', description: 'Export financial data' }
      ]
    },
    {
      name: 'System Administration',
      icon: 'fas fa-cog',
      permissions: [
        { key: 'system.settings', name: 'System Settings', description: 'Modify system configuration' },
        { key: 'system.logs', name: 'View Logs', description: 'Access system and audit logs' },
        { key: 'system.backup', name: 'Backup Management', description: 'Manage system backups' },
        { key: 'system.maintenance', name: 'Maintenance Mode', description: 'Enable/disable maintenance mode' }
      ]
    },
    {
      name: 'Security & Compliance',
      icon: 'fas fa-shield-alt',
      permissions: [
        { key: 'security.audit', name: 'Security Audit', description: 'Access security audit logs' },
        { key: 'security.permissions', name: 'Manage Permissions', description: 'Modify user permissions' },
        { key: 'security.sessions', name: 'Manage Sessions', description: 'View and terminate user sessions' },
        { key: 'security.compliance', name: 'Compliance Reports', description: 'Generate compliance reports' }
      ]
    }
  ];

  constructor(
    public imageService: ImageService
  ) {
  }

  ngOnInit(): void {
    this.loadAdminUsers();
  }

  ngAfterViewChecked() {
    if ((window as any)['lucide']) {
      (window as any)['lucide'].createIcons();
    }
  }

  loadAdminUsers(): void {
    // Mock data - replace with actual API call
    this.allAdmins = this.generateMockAdmins();
    this.applyFilters();
  }

  generateMockAdmins(): AdminUser[] {
    const departments = ['it', 'sales', 'support', 'marketing', 'finance'];
    const roles: AdminUser['role'][] = ['super_admin', 'admin', 'manager', 'moderator', 'support'];
    const statuses: AdminUser['status'][] = ['active', 'inactive', 'suspended'];

    const admins: AdminUser[] = [];
    const now = new Date();

    for (let i = 0; i < 25; i++) {
      const role = roles[Math.floor(Math.random() * roles.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const lastLogin = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);

      admins.push({
        id: `ADMIN${String(i + 1).padStart(3, '0')}`,
        name: `Admin User ${i + 1}`,
        email: `admin${i + 1}@company.com`,
        avatar: `/placeholder.svg?height=40&width=40`,
        role,
        department,
        status,
        isOnline: Math.random() > 0.7,
        lastLogin,
        permissions: this.generateRandomPermissions(role),
        createdAt: new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastActivity: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000)
      });
    }

    return admins.sort((a, b) => a.name.localeCompare(b.name));
  }

  generateRandomPermissions(role: AdminUser['role']): string[] {
    const allPermissions = this.permissionCategories.flatMap(cat => cat.permissions.map(p => p.key));
    
    // Different roles get different permission sets
    const rolePermissionCount = {
      super_admin: allPermissions.length,
      admin: Math.floor(allPermissions.length * 0.8),
      manager: Math.floor(allPermissions.length * 0.6),
      moderator: Math.floor(allPermissions.length * 0.4),
      support: Math.floor(allPermissions.length * 0.3)
    };

    const count = rolePermissionCount[role];
    const shuffled = [...allPermissions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Statistics getters
  get totalAdmins(): number {
    return this.allAdmins.length;
  }

  get activeAdmins(): number {
    return this.allAdmins.filter(admin => admin.status === 'active').length;
  }

  get onlineAdmins(): number {
    return this.allAdmins.filter(admin => admin.isOnline).length;
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

      const matchesRole = !this.roleFilter || admin.role === this.roleFilter;
      const matchesStatus = !this.statusFilter || admin.status === this.statusFilter;
      const matchesDepartment = !this.departmentFilter || admin.department === this.departmentFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.departmentFilter = '';
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

  toggleAdminSelection(adminId: string, event: any): void {
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
    console.log('Open create admin modal');
    // Implement modal opening logic
  }

  editAdmin(admin: AdminUser): void {
    console.log('Edit admin:', admin);
    // Implement edit functionality
  }

  deleteAdmin(admin: AdminUser): void {
    if (confirm(`Are you sure you want to delete ${admin.name}?`)) {
      this.allAdmins = this.allAdmins.filter(a => a.id !== admin.id);
      this.applyFilters();
      console.log('Admin deleted:', admin);
    }
  }

  toggleAdminStatus(admin: AdminUser): void {
    const newStatus = admin.status === 'active' ? 'suspended' : 'active';
    admin.status = newStatus;
    console.log(`Admin ${admin.name} status changed to ${newStatus}`);
  }

  resetPassword(admin: AdminUser): void {
    if (confirm(`Reset password for ${admin.name}?`)) {
      console.log('Password reset for:', admin);
      alert('Password reset email sent to ' + admin.email);
    }
  }

  // Permission methods
  viewPermissions(admin: AdminUser): void {
    this.selectedAdminForPermissions = admin;
    // Modal would be triggered via Bootstrap JS or Angular CDK
  }

  managePermissions(admin: AdminUser): void {
    this.selectedAdminForPermissions = admin;
    // Modal would be triggered via Bootstrap JS or Angular CDK
  }

  hasPermission(admin: AdminUser, permissionKey: string): boolean {
    return admin.permissions.includes(permissionKey);
  }

  togglePermission(permissionKey: string, event: any): void {
    if (!this.selectedAdminForPermissions) return;

    if (event.target.checked) {
      if (!this.selectedAdminForPermissions.permissions.includes(permissionKey)) {
        this.selectedAdminForPermissions.permissions.push(permissionKey);
      }
    } else {
      this.selectedAdminForPermissions.permissions = 
        this.selectedAdminForPermissions.permissions.filter(p => p !== permissionKey);
    }
  }

  savePermissions(): void {
    if (this.selectedAdminForPermissions) {
      console.log('Saving permissions for:', this.selectedAdminForPermissions);
      alert('Permissions updated successfully');
      // Close modal and refresh data
    }
  }

  // Activity methods
  viewAdminActivity(admin: AdminUser): void {
    this.selectedAdminForActivity = admin;
    this.loadAdminActivity(admin.id);
    // Modal would be triggered via Bootstrap JS or Angular CDK
  }

  loadAdminActivity(adminId: string): void {
    // Mock activity data
    this.adminActivities = this.generateMockActivity();
  }

  generateMockActivity(): AdminActivity[] {
    const activities: AdminActivity[] = [];
    const now = new Date();
    const activityTypes = ['login', 'logout', 'create', 'update', 'delete', 'security'];
    const actions = [
      'Logged into system',
      'Updated product pricing',
      'Created new user account',
      'Processed customer refund',
      'Deleted inactive user',
      'Changed system settings',
      'Exported customer data',
      'Reset user password'
    ];

    for (let i = 0; i < 20; i++) {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);

      activities.push({
        id: `ACT${String(i + 1).padStart(3, '0')}`,
        type,
        action,
        description: `${action} - Additional details about this activity`,
        timestamp,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  exportAdminActivity(): void {
    if (!this.selectedAdminForActivity) return;

    const csvContent = this.generateActivityCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-activity-${this.selectedAdminForActivity.name}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  generateActivityCSV(): string {
    const headers = ['Timestamp', 'Type', 'Action', 'Description', 'IP Address'];
    const rows = this.adminActivities.map(activity => [
      activity.timestamp.toISOString(),
      activity.type,
      activity.action,
      activity.description,
      activity.ipAddress
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
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

  getRoleLabel(role: string): string {
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Administrator',
      manager: 'Manager',
      moderator: 'Moderator',
      support: 'Support Agent'
    };
    return labels[role as keyof typeof labels] || role;
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

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  }

  refreshData(): void {
    this.loadAdminUsers();
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
      admin.department,
      admin.status,
      admin.lastLogin.toISOString(),
      admin.permissions.length.toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  trackByAdminId(index: number, admin: AdminUser): string {
    return admin.id;
  }
}