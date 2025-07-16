import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Add this line for Bootstrap JS modal API
declare var window: any;

interface Role {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  permissions: string[];
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface Permission {
  key: string;
  name: string;
  description: string;
  category: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'critical';
  dependencies?: string[];
}

interface PermissionCategory {
  name: string;
  icon: string;
  permissions: Permission[];
}

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'critical';
  permissions: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-roles-permissions',
  standalone: false,
  templateUrl: './roles-permissions.component.html',
  styleUrls: ['./roles-permissions.component.css']
})
export class RolesPermissionsComponent implements OnInit {
  // Data properties
  allRoles: Role[] = [];
  filteredRoles: Role[] = [];
  selectedRole: Role | null = null;
  assignedUsers: User[] = [];
  editingRole: Role | null = null;
  roleForm: FormGroup;
  selectedTemplate = '';

  // Search and filters
  roleSearchTerm = '';

  // Permission categories and templates
  permissionCategories: PermissionCategory[] = [
    {
      name: 'User Management',
      icon: 'fas fa-users',
      permissions: [
        { key: 'users.view', name: 'View Users', description: 'View customer and user accounts', category: 'users', level: 'basic' },
        { key: 'users.create', name: 'Create Users', description: 'Create new user accounts', category: 'users', level: 'intermediate' },
        { key: 'users.edit', name: 'Edit Users', description: 'Modify user account information', category: 'users', level: 'intermediate', dependencies: ['users.view'] },
        { key: 'users.delete', name: 'Delete Users', description: 'Delete user accounts', category: 'users', level: 'critical', dependencies: ['users.view', 'users.edit'] },
        { key: 'users.export', name: 'Export Users', description: 'Export user data', category: 'users', level: 'advanced', dependencies: ['users.view'] },
        { key: 'users.import', name: 'Import Users', description: 'Bulk import user data', category: 'users', level: 'advanced' }
      ]
    },
    {
      name: 'Product Management',
      icon: 'fas fa-box',
      permissions: [
        { key: 'products.view', name: 'View Products', description: 'View product catalog', category: 'products', level: 'basic' },
        { key: 'products.create', name: 'Create Products', description: 'Add new products', category: 'products', level: 'intermediate' },
        { key: 'products.edit', name: 'Edit Products', description: 'Modify product information', category: 'products', level: 'intermediate', dependencies: ['products.view'] },
        { key: 'products.delete', name: 'Delete Products', description: 'Remove products from catalog', category: 'products', level: 'critical', dependencies: ['products.view'] },
        { key: 'products.pricing', name: 'Manage Pricing', description: 'Update product prices and discounts', category: 'products', level: 'advanced', dependencies: ['products.view'] },
        { key: 'products.inventory', name: 'Manage Inventory', description: 'Update stock levels and inventory', category: 'products', level: 'intermediate', dependencies: ['products.view'] }
      ]
    },
    {
      name: 'Order Management',
      icon: 'fas fa-shopping-cart',
      permissions: [
        { key: 'orders.view', name: 'View Orders', description: 'View customer orders', category: 'orders', level: 'basic' },
        { key: 'orders.create', name: 'Create Orders', description: 'Create orders on behalf of customers', category: 'orders', level: 'intermediate' },
        { key: 'orders.edit', name: 'Edit Orders', description: 'Modify order details', category: 'orders', level: 'intermediate', dependencies: ['orders.view'] },
        { key: 'orders.cancel', name: 'Cancel Orders', description: 'Cancel customer orders', category: 'orders', level: 'advanced', dependencies: ['orders.view'] },
        { key: 'orders.refund', name: 'Process Refunds', description: 'Issue refunds to customers', category: 'orders', level: 'critical', dependencies: ['orders.view'] },
        { key: 'orders.export', name: 'Export Orders', description: 'Export order data', category: 'orders', level: 'advanced', dependencies: ['orders.view'] }
      ]
    },
    {
      name: 'Financial Operations',
      icon: 'fas fa-dollar-sign',
      permissions: [
        { key: 'finance.view', name: 'View Reports', description: 'View financial reports and analytics', category: 'finance', level: 'basic' },
        { key: 'finance.transactions', name: 'View Transactions', description: 'Access transaction history', category: 'finance', level: 'intermediate' },
        { key: 'finance.refunds', name: 'Process Refunds', description: 'Issue customer refunds', category: 'finance', level: 'critical' },
        { key: 'finance.export', name: 'Export Data', description: 'Export financial data', category: 'finance', level: 'advanced', dependencies: ['finance.view'] },
        { key: 'finance.reconcile', name: 'Reconcile Accounts', description: 'Perform account reconciliation', category: 'finance', level: 'critical', dependencies: ['finance.view', 'finance.transactions'] }
      ]
    },
    {
      name: 'System Administration',
      icon: 'fas fa-cog',
      permissions: [
        { key: 'system.settings', name: 'System Settings', description: 'Modify system configuration', category: 'system', level: 'critical' },
        { key: 'system.logs', name: 'View Logs', description: 'Access system and audit logs', category: 'system', level: 'advanced' },
        { key: 'system.backup', name: 'Backup Management', description: 'Manage system backups', category: 'system', level: 'critical' },
        { key: 'system.maintenance', name: 'Maintenance Mode', description: 'Enable/disable maintenance mode', category: 'system', level: 'critical' },
        { key: 'system.integrations', name: 'Manage Integrations', description: 'Configure third-party integrations', category: 'system', level: 'advanced' }
      ]
    },
    {
      name: 'Security & Compliance',
      icon: 'fas fa-shield-alt',
      permissions: [
        { key: 'security.audit', name: 'Security Audit', description: 'Access security audit logs', category: 'security', level: 'advanced' },
        { key: 'security.permissions', name: 'Manage Permissions', description: 'Modify user permissions', category: 'security', level: 'critical' },
        { key: 'security.sessions', name: 'Manage Sessions', description: 'View and terminate user sessions', category: 'security', level: 'advanced' },
        { key: 'security.compliance', name: 'Compliance Reports', description: 'Generate compliance reports', category: 'security', level: 'advanced', dependencies: ['security.audit'] },
        { key: 'security.2fa', name: 'Manage 2FA', description: 'Configure two-factor authentication', category: 'security', level: 'critical' }
      ]
    }
  ];

  permissionTemplates: PermissionTemplate[] = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full access to all system features and settings',
      level: 'critical',
      permissions: this.getAllPermissionKeys()
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Management access with user and product oversight',
      level: 'advanced',
      permissions: [
        'users.view', 'users.create', 'users.edit', 'users.export',
        'products.view', 'products.create', 'products.edit', 'products.pricing', 'products.inventory',
        'orders.view', 'orders.edit', 'orders.cancel', 'orders.export',
        'finance.view', 'finance.transactions', 'finance.export'
      ]
    },
    {
      id: 'support',
      name: 'Support Agent',
      description: 'Customer support with limited administrative access',
      level: 'intermediate',
      permissions: [
        'users.view', 'users.edit',
        'products.view',
        'orders.view', 'orders.edit', 'orders.cancel', 'orders.refund',
        'finance.view'
      ]
    },
    {
      id: 'readonly',
      name: 'Read-Only',
      description: 'View-only access for reporting and monitoring',
      level: 'basic',
      permissions: [
        'users.view',
        'products.view',
        'orders.view',
        'finance.view',
        'system.logs'
      ]
    }
  ];

  constructor(private fb: FormBuilder) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      status: ['active']
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    // Mock data - replace with actual API call
    this.allRoles = this.generateMockRoles();
    this.filterRoles();
  }

  generateMockRoles(): Role[] {
    const roles: Role[] = [
      {
        id: 'ROLE001',
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        status: 'active',
        permissions: this.getAllPermissionKeys(),
        userCount: 2,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        createdBy: 'System'
      },
      {
        id: 'ROLE002',
        name: 'Store Manager',
        description: 'Manage products, orders, and customer service',
        status: 'active',
        permissions: [
          'users.view', 'users.edit',
          'products.view', 'products.create', 'products.edit', 'products.pricing', 'products.inventory',
          'orders.view', 'orders.edit', 'orders.cancel', 'orders.refund',
          'finance.view', 'finance.transactions'
        ],
        userCount: 5,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-25'),
        createdBy: 'Admin'
      },
      {
        id: 'ROLE003',
        name: 'Customer Support',
        description: 'Handle customer inquiries and basic order management',
        status: 'active',
        permissions: [
          'users.view', 'users.edit',
          'products.view',
          'orders.view', 'orders.edit', 'orders.cancel',
          'finance.view'
        ],
        userCount: 12,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-22'),
        createdBy: 'Admin'
      },
      {
        id: 'ROLE004',
        name: 'Inventory Manager',
        description: 'Manage product catalog and inventory levels',
        status: 'active',
        permissions: [
          'products.view', 'products.create', 'products.edit', 'products.inventory',
          'orders.view'
        ],
        userCount: 3,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-18'),
        createdBy: 'Manager'
      },
      {
        id: 'ROLE005',
        name: 'Financial Analyst',
        description: 'Access to financial reports and transaction data',
        status: 'active',
        permissions: [
          'finance.view', 'finance.transactions', 'finance.export', 'finance.reconcile',
          'orders.view'
        ],
        userCount: 2,
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-21'),
        createdBy: 'Admin'
      },
      {
        id: 'ROLE006',
        name: 'Content Editor',
        description: 'Edit product information and descriptions',
        status: 'inactive',
        permissions: [
          'products.view', 'products.edit'
        ],
        userCount: 0,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-16'),
        createdBy: 'Manager'
      }
    ];

    return roles;
  }

  getAllPermissionKeys(): string[] {
    return this.permissionCategories.flatMap(category => 
      category.permissions.map(permission => permission.key)
    );
  }

  // Statistics getters
  get totalRoles(): number {
    return this.allRoles.length;
  }

  get activeRoles(): number {
    return this.allRoles.filter(role => role.status === 'active').length;
  }

  get totalPermissions(): number {
    return this.getAllPermissionKeys().length;
  }

  // get assignedUsers(): number {
  //   return this.allRoles.reduce((total, role) => total + role.userCount, 0);
  // }

  get totalAvailablePermissions(): number {
    return this.getAllPermissionKeys().length;
  }

  // Filter methods
  filterRoles(): void {
    this.filteredRoles = this.allRoles.filter(role =>
      role.name.toLowerCase().includes(this.roleSearchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(this.roleSearchTerm.toLowerCase())
    );
  }

  // Role selection and management
  selectRole(role: Role): void {
    this.selectedRole = role;
    this.loadAssignedUsers(role.id);
  }

  loadAssignedUsers(roleId: string): void {
    // Mock data - replace with actual API call
    this.assignedUsers = this.generateMockUsers();
  }

  generateMockUsers(): User[] {
    return [
      {
        id: 'USER001',
        name: 'John Smith',
        email: 'john.smith@company.com',
        avatar: '/placeholder.svg?height=40&width=40',
        department: 'administration',
        status: 'active'
      },
      {
        id: 'USER002',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        avatar: '/placeholder.svg?height=40&width=40',
        department: 'customer_service',
        status: 'active'
      },
      {
        id: 'USER003',
        name: 'Mike Wilson',
        email: 'mike.wilson@company.com',
        avatar: '/placeholder.svg?height=40&width=40',
        department: 'inventory',
        status: 'active'
      }
    ];
  }

  openCreateRoleModal(): void {
    this.editingRole = null;
    this.roleForm.reset({ status: 'active' });
    this.selectedTemplate = '';
    new window.bootstrap.Modal(document.getElementById('roleModal')).show();
  }

  editRole(role: Role): void {
    this.editingRole = role;
    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
      status: role.status
    });
    new window.bootstrap.Modal(document.getElementById('roleModal')).show();
  }

  saveRole(): void {
    if (this.roleForm.valid) {
      const formValue = this.roleForm.value;
      
      if (this.editingRole) {
        // Update existing role
        this.editingRole.name = formValue.name;
        this.editingRole.description = formValue.description;
        this.editingRole.status = formValue.status;
        this.editingRole.updatedAt = new Date();
        console.log('Role updated:', this.editingRole);
      } else {
        // Create new role
        const newRole: Role = {
          id: `ROLE${String(this.allRoles.length + 1).padStart(3, '0')}`,
          name: formValue.name,
          description: formValue.description,
          status: formValue.status,
          permissions: this.selectedTemplate ? this.getTemplatePermissions(this.selectedTemplate) : [],
          userCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'Current User'
        };
        
        this.allRoles.push(newRole);
        console.log('Role created:', newRole);
      }
      
      this.filterRoles();
      window.bootstrap.Modal.getInstance(document.getElementById('roleModal')).hide();
    }
  }

  getTemplatePermissions(templateId: string): string[] {
    const template = this.permissionTemplates.find(t => t.id === templateId);
    return template ? template.permissions : [];
  }

  duplicateRole(role: Role): void {
    const duplicatedRole: Role = {
      ...role,
      id: `ROLE${String(this.allRoles.length + 1).padStart(3, '0')}`,
      name: `${role.name} (Copy)`,
      userCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Current User'
    };
    
    this.allRoles.push(duplicatedRole);
    this.filterRoles();
    console.log('Role duplicated:', duplicatedRole);
  }

  toggleRoleStatus(role: Role): void {
    role.status = role.status === 'active' ? 'inactive' : 'active';
    role.updatedAt = new Date();
    console.log(`Role ${role.name} status changed to ${role.status}`);
  }

  deleteRole(role: Role): void {
    if (confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      this.allRoles = this.allRoles.filter(r => r.id !== role.id);
      if (this.selectedRole?.id === role.id) {
        this.selectedRole = null;
      }
      this.filterRoles();
      console.log('Role deleted:', role);
    }
  }

  // Permission methods
  hasPermission(role: Role, permissionKey: string): boolean {
    return role.permissions.includes(permissionKey);
  }

  togglePermission(permissionKey: string, event: any): void {
    if (!this.selectedRole) return;

    if (event.target.checked) {
      if (!this.selectedRole.permissions.includes(permissionKey)) {
        this.selectedRole.permissions.push(permissionKey);
        this.addDependentPermissions(permissionKey);
      }
    } else {
      this.selectedRole.permissions = this.selectedRole.permissions.filter(p => p !== permissionKey);
      this.removeDependentPermissions(permissionKey);
    }
  }

  addDependentPermissions(permissionKey: string): void {
    const permission = this.findPermission(permissionKey);
    if (permission?.dependencies && this.selectedRole) {
      permission.dependencies.forEach(dep => {
        if (!this.selectedRole!.permissions.includes(dep)) {
          this.selectedRole!.permissions.push(dep);
        }
      });
    }
  }

  removeDependentPermissions(permissionKey: string): void {
    if (!this.selectedRole) return;

    // Find permissions that depend on the removed permission
    const dependentPermissions = this.getAllPermissions().filter(p => 
      p.dependencies?.includes(permissionKey)
    );

    // Remove dependent permissions
    dependentPermissions.forEach(dep => {
      this.selectedRole!.permissions = this.selectedRole!.permissions.filter(p => p !== dep.key);
    });
  }

  findPermission(key: string): Permission | undefined {
    return this.getAllPermissions().find(p => p.key === key);
  }

  getAllPermissions(): Permission[] {
    return this.permissionCategories.flatMap(category => category.permissions);
  }

  getCategoryPermissionCount(category: PermissionCategory): number {
    if (!this.selectedRole) return 0;
    return category.permissions.filter(p => this.selectedRole!.permissions.includes(p.key)).length;
  }

  selectAllPermissions(): void {
    if (!this.selectedRole) return;
    this.selectedRole.permissions = [...this.getAllPermissionKeys()];
  }

  clearAllPermissions(): void {
    if (!this.selectedRole) return;
    this.selectedRole.permissions = [];
  }

  applyTemplate(): void {
    new window.bootstrap.Modal(document.getElementById('templatesModal')).show();
  }

  applyPermissionTemplate(template: PermissionTemplate): void {
    if (!this.selectedRole) return;
    this.selectedRole.permissions = [...template.permissions];
    console.log(`Applied template ${template.name} to role ${this.selectedRole.name}`);
  }

  previewTemplate(template: PermissionTemplate): void {
    console.log('Preview template:', template);
    // Show template details in a modal or expand section
  }

  savePermissions(): void {
    if (!this.selectedRole) return;
    
    this.selectedRole.updatedAt = new Date();
    console.log('Permissions saved for role:', this.selectedRole);
    alert('Permissions updated successfully');
  }

  // Utility methods
  canEditRole(role: Role): boolean {
    // Add logic to check if current user can edit this role
    return role.status === 'active';
  }

  getPermissionLevel(role: Role): string {
    const permissionCount = role.permissions.length;
    const totalPermissions = this.totalAvailablePermissions;
    const percentage = (permissionCount / totalPermissions) * 100;

    if (percentage >= 80) return 'critical';
    if (percentage >= 60) return 'advanced';
    if (percentage >= 30) return 'intermediate';
    return 'basic';
  }

  getStatusIcon(status: string): string {
    return status === 'active' ? 'fas fa-check-circle' : 'fas fa-pause-circle';
  }

  getDependencyNames(dependencies: string[]): string[] {
    return dependencies.map(dep => {
      const permission = this.findPermission(dep);
      return permission ? permission.name : dep;
    });
  }

  getPreviewUsers(role: Role): User[] {
    return this.assignedUsers.slice(0, 3);
  }

  viewAssignedUsers(): void {
    new window.bootstrap.Modal(document.getElementById('assignedUsersModal')).show();
  }

  removeUserFromRole(user: User): void {
    if (confirm(`Remove ${user.name} from this role?`)) {
      this.assignedUsers = this.assignedUsers.filter(u => u.id !== user.id);
      if (this.selectedRole) {
        this.selectedRole.userCount = Math.max(0, this.selectedRole.userCount - 1);
      }
      console.log('User removed from role:', user);
    }
  }

  openAssignUsersModal(): void {
    new window.bootstrap.Modal(document.getElementById('assignUsersModal')).show();
  }

  refreshData(): void {
    this.loadRoles();
    console.log('Data refreshed');
  }

  exportRoles(): void {
    const csvContent = this.generateRolesCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roles-permissions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  generateRolesCSV(): string {
    const headers = ['Role Name', 'Description', 'Status', 'Users Assigned', 'Permissions Count', 'Created Date'];
    const rows = this.allRoles.map(role => [
      role.name,
      role.description,
      role.status,
      role.userCount.toString(),
      role.permissions.length.toString(),
      role.createdAt.toISOString().split('T')[0]
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  trackByRoleId(index: number, role: Role): string {
    return role.id;
  }

  openRoleModal(editing = false, role: Role | null = null) {
    if (editing && role) {
      this.editingRole = role;
      this.roleForm.patchValue({
        name: role.name,
        description: role.description,
        status: role.status
      });
    } else {
      this.editingRole = null;
      this.roleForm.reset({ status: 'active' });
    }
    new window.bootstrap.Modal(document.getElementById('roleModal')).show();
  }

  openTemplatesModal() {
    new window.bootstrap.Modal(document.getElementById('templatesModal')).show();
  }

  openAssignedUsersModal(role: any) {
    this.selectedRole = role;
    // Example assigned users (replace with actual fetch logic)
    this.assignedUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', department: 'sales', status: 'active', avatar: 'https://i.pravatar.cc/40' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', department: 'support', status: 'inactive', avatar: 'https://i.pravatar.cc/41' }
    ];
    new window.bootstrap.Modal(document.getElementById('assignedUsersModal')).show();
  }

  saveRoleModal() {
    if (this.roleForm.invalid) return;
    const formValue = this.roleForm.value;
    if (this.editingRole) {
      // Update existing role
      this.editingRole.name = formValue.name;
      this.editingRole.description = formValue.description;
      this.editingRole.status = formValue.status;
      this.editingRole.updatedAt = new Date();
      // Optionally: update role in roles array if needed
    } else {
      // Create new role
      const newRole: Role = {
        id: `ROLE${String(this.allRoles.length + 1).padStart(3, '0')}`,
        name: formValue.name,
        description: formValue.description,
        status: formValue.status,
        permissions: [], // You can set this based on your logic or form
        userCount: 0, // Default new role has 0 users
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'Current User' // Replace with actual user if available
      };
      this.allRoles.push(newRole);
    }
    window.bootstrap.Modal.getInstance(document.getElementById('roleModal')).hide();
  }

  previewTemplateModal(template: any) {
    // Show template details (could open a modal or display inline)
    alert(`Previewing: ${template.name}`);
  }

  applyPermissionTemplateModal(template: any) {
    // Apply template permissions to the form or role being created/edited
    this.selectedTemplate = template.level;
    // You might want to update your form or permissions array accordingly
  }

  removeUserFromRoleModal(user: any) {
    this.assignedUsers = this.assignedUsers.filter(u => u !== user);
  }

  assignUsersToRoleModal() {
    // Logic to assign more users (could open another modal or navigate to a page)
    alert('Assign more users to this role');
  }
}