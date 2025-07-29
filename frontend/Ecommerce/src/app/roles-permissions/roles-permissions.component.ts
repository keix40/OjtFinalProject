import { Component, OnInit, ViewChild, TemplateRef, AfterViewInit, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../auth/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { ImageService } from '../services/image.service';
import { HttpClient } from '@angular/common/http';
import { PermissionCategoryService } from '../services/permission-category.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { PermissionConstants } from '../constants/permission.constants';

interface Role {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  permissions: string[];
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  level: number;
}

interface Permission {
  id?: number;
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
  id: number;
  name: string;
  email: string;
  avatar: string;
  department: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-roles-permissions',
  templateUrl: './roles-permissions.component.html',
  standalone: false,
  styleUrls: ['./roles-permissions.component.css'],
  animations: [
    trigger('accordionAnimation', [
      state('void', style({ height: '0', opacity: 0, padding: '0 1rem' })),
      state('*', style({ height: '*', opacity: 1, padding: '*' })),
      transition('void <=> *', animate('300ms cubic-bezier(0.4,0,0.2,1)')),
    ]),
  ]
})
export class RolesPermissionsComponent implements OnInit, AfterViewInit, AfterViewChecked {
  public PermissionConstants = PermissionConstants;
  // Data properties
  allRoles: Role[] = [];
  filteredRoles: Role[] = [];
  selectedRole: Role | null = null;
  assignedUsersList: User[] = [];
  editingRole: Role | null = null;
  allUsers: User[] = [];
  selectedUserId: number | null = null;
  selectedUsersForAssignment: { [key: number]: boolean } = {};
  userAssignmentSearchTerm = '';
  filteredAllUsers: User[] = [];
  openDropdownId: number | null = null;
  expandedCategory: number | null = 0;

  // NEW: A temporary, separate checklist for the permission checkboxes.
  // This will fix the "select all" bug.
  permissionCheckState = new Map<string, boolean>();

  canCreateRole = false;
  canEditRolePermission = false;
  canDeleteRole = false;
  canAssignPermissions = false;

  @ViewChild('assignUsersDialog') assignUsersDialog!: TemplateRef<any>;

  // Form
  roleForm: FormGroup;
  selectedTemplate = '';

  // Search and filters
  roleSearchTerm = '';

  // Permission categories and templates
  permissionCategories: PermissionCategory[] = [];

  permissionTemplates: PermissionTemplate[] = [];

  expandedPreviewCategories: { [index: number]: boolean } = {};

  // Add currentUser property for role level checks in the template
  currentUser: any = {
    id: 1,
    name: 'Current User',
    role: {
      id: 1,
      name: 'ADMIN',
      level: 6
    }
  };

  // Call this when opening a new preview to expand all categories by default
  ngOnChanges() {
    this.expandAllPreviewCategories();
  }

  expandAllPreviewCategories() {
    const groups = this.getPreviewedTemplatePermissionsByCategory();
    this.expandedPreviewCategories = {};
    groups.forEach((_, i) => {
      this.expandedPreviewCategories[i] = true;
    });
  }

  // Ensure expand all when previewedTemplate changes
  set previewedTemplateSetter(val: any) {
    this.previewedTemplate = val;
    this.expandAllPreviewCategories();
  }

  private _previewedTemplate: PermissionTemplate | null = null;
  get previewedTemplate(): PermissionTemplate | null {
    return this._previewedTemplate;
  }
  set previewedTemplate(val: PermissionTemplate | null) {
    this._previewedTemplate = val;
    this.expandAllPreviewCategories();
  }

  // Modal state variables
  showRoleModal = false;
  showTemplatesModal = false;
  showTemplatePreviewModal = false;
  showAssignedUsersModal = false;
  showAssignUsersDialog = false;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    public permissionService: PermissionService,
    private authService: AuthService,
    private modalService: NgbModal,
    public imageService: ImageService,
    private permissionCategoryService: PermissionCategoryService
  ) {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      status: ['active'],
      level: [1] // Add level control for dynamic assignment
    });
  }

  ngOnInit(): void {
    // Use the correct permission constants
    this.canCreateRole = this.permissionService.hasPermission(PermissionConstants.ROLES_ASSIGN_PERMISSIONS);
    this.canEditRolePermission = this.permissionService.hasPermission(PermissionConstants.ROLES_ASSIGN_PERMISSIONS);
    this.canDeleteRole = this.permissionService.hasPermission(PermissionConstants.ROLES_ASSIGN_PERMISSIONS);
    this.canAssignPermissions = this.permissionService.hasPermission(PermissionConstants.ROLES_ASSIGN_PERMISSIONS);
    
    this.loadRoles();
    this.loadPermissions();
    this.loadAllUsers();
    this.loadPermissionCategories();

    // Extract roleLevel from JWT and set currentUser dynamically
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUser = this.currentUser || {};
      this.currentUser.role = this.currentUser.role || {};
      this.currentUser.role.level = payload.roleLevel;
    }

    // Dynamically load permission templates from roles
    this.roleService.getAllRoles().subscribe((roles: any[]) => {
      this.permissionTemplates = roles.map(role => ({
        id: String(role.id),
        name: role.name,
        description: role.description || '',
        level: this.getPermissionLevelFromCount(role.permissions?.length || 0),
        permissions: role.permissions || []
      }));
    });

    // Debug: Check for duplicate permission keys
    const allKeys = this.getAllPermissionKeys();
    const duplicates = allKeys.filter((key, index) => allKeys.indexOf(key) !== index);
    if (duplicates.length > 0) {
      console.warn('Duplicate permission keys found:', duplicates);
    }
  }

  ngAfterViewInit(): void {
    if ((window as any)['lucide']) {
      (window as any)['lucide'].createIcons();
    }
  }

  ngAfterViewChecked(): void {
    if ((window as any)['lucide']) {
      (window as any)['lucide'].createIcons();
    }
  }

  loadPermissionCategories(): void {
    this.permissionCategoryService.getPermissionCategories().subscribe({
      next: (categories) => {
        console.log('[PermissionCategories] Loaded:', categories);
        this.permissionCategories = categories;
      },
      error: (err) => {
        console.error('Error loading permission categories:', err);
        this.permissionCategories = [];
      }
    });
  }

  // Load all users for dropdown
  loadAllUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (res: any[]) => {
        console.log('Debug: All users loaded from backend:', res);
        this.allUsers = res;
        this.filteredAllUsers = [...this.allUsers];
      },
      error: (err: any) => {
        console.error('Error loading users:', err);
      }
    });
  }

  // Assign selected role to selected user
  assignRoleToSelectedUser(): void {
    if (!this.selectedRole || !this.selectedUserId) {
      alert('Select both role and user');
      return;
    }

    this.roleService.assignRoleToUser(this.selectedUserId, this.selectedRole.id).subscribe({
      next: () => {
        alert('Role assigned successfully!');
        this.loadAssignedUsers(this.selectedRole!.id); // Refresh user preview
      },
      error: (err) => {
        console.error('Error assigning role:', err);
      }
    });
  }
  loadUsersByRole(roleId: number): void {
    this.authService.getUsersByRoleId(roleId).subscribe({
      next: (users: User[]) => {
        this.assignedUsersList = users;
      },
      error: (err) => console.error('Error loading users by role:', err)
    });
  }


  //fix load role
  loadRoles(): void {
    this.roleService.getAllRoles().subscribe({
      next: (data: any[]) => {
        console.log('Debug: All roles loaded from backend:', data);
        // Map the backend response to the full Role interface
        this.allRoles = data.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description || `Description for ${role.name}`,
          status: role.status || 'active',
          permissions: role.permissions || [],
          userCount: role.userCount || 0,
          createdAt: role.createdAt ? new Date(role.createdAt) : new Date(),
          updatedAt: role.updatedAt ? new Date(role.updatedAt) : new Date(),
          createdBy: role.createdBy || 'System',
          level: role.level !== undefined ? role.level : 1 // Default to 1 if missing
        }));
        // Debug: Log permissions for each role
        this.allRoles.forEach(r => {
          console.log(`Debug: Role ${r.name} (ID: ${r.id}) permissions:`, r.permissions);
        });
        // Load user counts for each role
        this.loadUserCountsForRoles();
        this.filterRoles();
      },
      error: (err) => console.error('Error loading roles:', err)
    });
  }

  // Load user counts for all roles
  loadUserCountsForRoles(): void {
    this.allRoles.forEach(role => {
      this.authService.getUsersByRoleId(role.id).subscribe({
        next: (users: any[]) => {
          role.userCount = users.length;
          console.log(`Debug: Role ${role.name} has ${users.length} users`);
        },
        error: (err) => {
          console.error(`Error loading users for role ${role.id}:`, err);
          role.userCount = 0;
        }
      });
    });
  }

  //fix load permission
  loadPermissions(): void {
    console.log('loadPermissions called');
    this.permissionService.getAllPermissions().subscribe({
      next: (permissions: Permission[]) => {
        // Map permissions to ensure each has a 'key' property
        const mappedPermissions = permissions.map(perm => ({
          ...perm,
          key: perm.key || perm.name // Use 'name' as key if 'key' is missing
        }));
        console.log('Permissions after mapping:', mappedPermissions);
        mappedPermissions.forEach((perm, idx) => {
          console.log(`Permission[${idx}]: id=${perm.id}, key=${perm.key}, name=${perm.name}`);
        });
        const grouped = this.groupPermissionsByCategory(mappedPermissions);
        console.log('Grouped permissions:', grouped);
        this.permissionCategories = grouped;
        this.setupTemplates(); // 🔧 Build templates after permission loaded
        // Debug: Check for duplicate permission keys (after loading from backend)
        const allKeys = this.getAllPermissionKeys();
        const duplicates = allKeys.filter((key, index) => allKeys.indexOf(key) !== index);
        if (duplicates.length > 0) {
          console.warn('Duplicate permission keys found:', duplicates);
        } else {
          console.log('No duplicate permission keys found.');
        }
      },
      error: (err) => console.error('Error loading permissions:', err)
    });
  }

  groupPermissionsByCategory(permissions: Permission[]): PermissionCategory[] {
    const grouped: { [key: string]: Permission[] } = {};
    permissions.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });

    return Object.entries(grouped).map(([name, permissions]) => ({
      name,
      icon: 'fas fa-folder', // you can enhance this
      permissions
    }));
  }

  setupTemplates(): void {
    const allKeys = this.getAllPermissionKeys();
    this.permissionTemplates = [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full access',
        level: 'critical',
        permissions: allKeys
      },
      {
        id: 'readonly',
        name: 'Read-Only',
        description: 'View-only access',
        level: 'basic',
        permissions: allKeys.filter(k => k.includes('.view') || k.includes('.logs'))
      }


    ];
  }

  // generateMockRoles(): Role[] {
  //   const roles: Role[] = [
  //     {
  //       id: 1,
  //       name: 'Super Administrator',
  //       description: 'Full system access with all permissions',
  //       status: 'active',
  //       permissions: this.getAllPermissionKeys(),
  //       userCount: 2,
  //       createdAt: new Date('2024-01-15'),
  //       updatedAt: new Date('2024-01-20'),
  //       createdBy: 'System'
  //     },
  //     {
  //       id: 2,
  //       name: 'Store Manager',
  //       description: 'Manage products, orders, and customer service',
  //       status: 'active',
  //       permissions: [
  //         'users.view', 'users.edit',
  //         'products.view', 'products.create', 'products.edit', 'products.pricing', 'products.inventory',
  //         'orders.view', 'orders.edit', 'orders.cancel', 'orders.refund',
  //         'finance.view', 'finance.transactions'
  //       ],
  //       userCount: 5,
  //       createdAt: new Date('2024-01-10'),
  //       updatedAt: new Date('2024-01-25'),
  //       createdBy: 'Admin'
  //     },
  //     {
  //       id: 3,
  //       name: 'Customer Support',
  //       description: 'Handle customer inquiries and basic order management',
  //       status: 'active',
  //       permissions: [
  //         'users.view', 'users.edit',
  //         'products.view',
  //         'orders.view', 'orders.edit', 'orders.cancel',
  //         'finance.view'
  //       ],
  //       userCount: 12,
  //       createdAt: new Date('2024-01-08'),
  //       updatedAt: new Date('2024-01-22'),
  //       createdBy: 'Admin'
  //     },
  //     {
  //       id: 4,
  //       name: 'Inventory Manager',
  //       description: 'Manage product catalog and inventory levels',
  //       status: 'active',
  //       permissions: [
  //         'products.view', 'products.create', 'products.edit', 'products.inventory',
  //         'orders.view'
  //       ],
  //       userCount: 3,
  //       createdAt: new Date('2024-01-12'),
  //       updatedAt: new Date('2024-01-18'),
  //       createdBy: 'Manager'
  //     },
  //     {
  //       id: 5,
  //       name: 'Financial Analyst',
  //       description: 'Access to financial reports and transaction data',
  //       status: 'active',
  //       permissions: [
  //         'finance.view', 'finance.transactions', 'finance.export', 'finance.reconcile',
  //         'orders.view'
  //       ],
  //       userCount: 2,
  //       createdAt: new Date('2024-01-14'),
  //       updatedAt: new Date('2024-01-21'),
  //       createdBy: 'Admin'
  //     },
  //     {
  //       id: 6,
  //       name: 'Content Editor',
  //       description: 'Edit product information and descriptions',
  //       status: 'inactive',
  //       permissions: [
  //         'products.view', 'products.edit'
  //       ],
  //       userCount: 0,
  //       createdAt: new Date('2024-01-05'),
  //       updatedAt: new Date('2024-01-16'),
  //       createdBy: 'Manager'
  //     }
  //   ];
  //   return roles;
  // }

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

  get assignedUsers(): number {
    return this.allRoles.reduce((total, role) => total + (role.userCount || 0), 0);
  }

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

    this.permissionCheckState.clear();
    const permissionKeys = (role.permissions ?? []).map((perm: any) =>
      typeof perm === 'string' ? perm.toLowerCase().trim() : (perm.key?.toLowerCase().trim() ?? '')
    );
    this.getAllPermissions().forEach(p => {
      const hasPerm = permissionKeys.includes(p.key.toLowerCase().trim());
      this.permissionCheckState.set(p.key, hasPerm);
    });

    this.loadAssignedUsers(role.id);
  }

  // If you have userService injected
  loadAssignedUsers(roleId: number): void {
    this.authService.getUsersByRoleId(roleId).subscribe({
      next: (users: any[]) => {
        console.log('Debug: Users loaded for role', roleId, users);
        this.assignedUsersList = users.map(u => ({
          ...u,
          avatar: this.imageService.getAvatarImageUrl(u)
        }));
      },
      error: (err) => console.error('Error loading assigned users:', err)
    });
  }



  generateMockUsers(): User[] {
    return [
      {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@company.com',
        avatar: '/placeholder.svg?height=40&width=40',
        department: 'administration',
        status: 'active'
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        avatar: '/placeholder.svg?height=40&width=40',
        department: 'customer_service',
        status: 'active'
      },
      {
        id: 3,
        name: 'Mike Wilson',
        email: 'mike.wilson@company.com',
        avatar: '/placeholder.svg?height=40&width=40',
        department: 'inventory',
        status: 'active'
      }
    ];
  }

  openCreateRoleModal(): void {
    if (!this.canCreateRole) return;
    this.editingRole = null;
    this.roleForm.reset({ status: 'active' });
    this.selectedTemplate = '';
    this.showRoleModal = true;
  }

  closeCreateRoleModal(): void {
    this.showRoleModal = false;
  }

  editRole(role: Role): void {
    if (!this.canEditRolePermission) return;
    this.editingRole = role;
    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
      status: role.status
    });
    this.showRoleModal = true;
  }

  closeEditRoleModal(): void {
    this.showRoleModal = false;
  }

  saveRole(): void {
    if (this.roleForm.valid) {
      const formValue = this.roleForm.value;

      if (this.editingRole) {
        this.editingRole.name = formValue.name;
        this.editingRole.description = formValue.description;
        this.editingRole.status = formValue.status;
        this.editingRole.updatedAt = new Date();
        console.log('Role updated:', this.editingRole);
      } else {
        // Create new role
        const newRole: Role = {
          id: this.allRoles.length > 0 ? Math.max(...this.allRoles.map(r => r.id)) + 1 : 1,
          name: formValue.name,
          description: formValue.description,
          status: formValue.status,
          permissions: this.selectedTemplate ? this.getTemplatePermissions(this.selectedTemplate) : [],
          userCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'Current User',
          level: formValue.level // Set dynamically from form
        };

        this.roleService.createRole(newRole).subscribe({
          next: (data) => {
            this.allRoles.push(data);
            this.filterRoles();
          },
          error: (err: any) => console.error('Error creating role:', err)
        });
        console.log('Role created:', newRole);
      }

      this.filterRoles();
      // Close modal and show success message
      this.closeCreateRoleModal();
    }
  }

  getTemplatePermissions(templateId: string): string[] {
    const template = this.permissionTemplates.find(t => t.id === templateId);
    return template ? template.permissions : [];
  }

  duplicateRole(role: Role): void {
    const duplicatedRole: Role = {
      ...role,
      id: this.allRoles.length > 0 ? Math.max(...this.allRoles.map(r => r.id)) + 1 : 1,
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
    if (!this.canDeleteRole) return;
    if (confirm(`Are you sure you want to delete "${role.name}"?`)) {
      this.roleService.deleteRole(role.id).subscribe({
        next: () => {
          this.allRoles = this.allRoles.filter(r => r.id !== role.id);
          if (this.selectedRole?.id === role.id) {
            this.selectedRole = null;
          }
          this.filterRoles();
          console.log('Role deleted:', role);
        },
        error: (err) => console.error('Error deleting role:', err)
      });
    }
  }


  // Permission methods
  hasPermission(role: Role, permissionKey: string): boolean {
    return role.permissions.includes(permissionKey);
  }

  getCheckedPermissionCount(): number {
    let count = 0;
    for (const key of this.getAllPermissionKeys()) {
      if (this.permissionCheckState.get(key)) count++;
    }
    return count;
  }

  togglePermission(permissionKey: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
  
    // 🔧 fix: clone the map first to trigger change detection
    const updatedMap = new Map(this.permissionCheckState);
    updatedMap.set(permissionKey, isChecked);
  
    const permission = this.findPermission(permissionKey);
  
    // ✅ If checking: also check dependencies
    if (isChecked) {
      if (permission?.dependencies) {
        permission.dependencies.forEach(depKey => {
          updatedMap.set(depKey, true);
        });
      }
    } else {
      // ✅ If unchecking: remove from all dependent permissions
      const dependentPermissions = this.getAllPermissions().filter(
        p => p.dependencies?.includes(permissionKey)
      );
      dependentPermissions.forEach(dep => {
        updatedMap.set(dep.key, false);
      });
    }
  
    // ✅ Replace the entire map to trigger Angular change detection
    this.permissionCheckState = updatedMap;
  }
  

  findPermission(key: string): Permission | undefined {
    return this.getAllPermissions().find(p => p.key === key);
  }

  getAllPermissions(): Permission[] {
    return this.permissionCategories.flatMap(category => category.permissions);
  }

  getCategoryPermissionCount(category: PermissionCategory): number {
    if (!this.selectedRole) return 0;
    let count = 0;
    category.permissions.forEach(p => {
      if (this.permissionCheckState.get(p.key)) {
        count++;
      }
    });
    return count;
  }

  selectAllPermissions(): void {
    if (!this.selectedRole) return;
    for (const key of this.permissionCheckState.keys()) {
      this.permissionCheckState.set(key, true);
    }
  }

  clearAllPermissions(): void {
    if (!this.selectedRole) return;
    this.permissionCheckState.forEach((value, key) => {
      this.permissionCheckState.set(key, false);
    });
  }

  applyTemplate(): void {
    // Modal would be triggered via Bootstrap JS or Angular CDK
  }

  applyPermissionTemplate(template: PermissionTemplate): void {
    if (!this.selectedRole) return;
    
    // First, clear all checks
    this.permissionCheckState.forEach((value, key) => {
      this.permissionCheckState.set(key, false);
    });

    // Then, apply the template's permissions
    template.permissions.forEach(permissionKey => {
      this.permissionCheckState.set(permissionKey, true);
    });

    console.log(`Applied template ${template.name} to role ${this.selectedRole.name}`);
  }

  previewTemplate(template: PermissionTemplate): void {
    this.previewedTemplate = template;
    this.showTemplatePreviewModal = true;
  }

  closePreviewTemplateModal(): void {
    this.showTemplatePreviewModal = false;
  }

  private getPermissionIdsFromKeys(keys: string[]): number[] {
    const allPermissions = this.getAllPermissions();
    return keys
      .map(key => (allPermissions.find((p: any) => p.key === key)?.id))
      .filter((id): id is number => typeof id === 'number');
  }

  savePermissions(): void {
    console.log('savePermissions');
    console.log('canAssignPermissions:', this.canAssignPermissions);
    console.log('selectedRole:', this.selectedRole);

    if (!this.canAssignPermissions) {
      console.warn('Cannot assign permissions: missing permission');
      return;
    }
    if (!this.selectedRole) {
      console.warn('No role selected');
      return;
    }

    // Build the final permissions list from our temporary checklist
    const finalPermissions = Array.from(new Set(
      Array.from(this.permissionCheckState.entries())
        .filter(([key, isChecked]) => isChecked)
        .map(([key]) => key)
    ));

    const permissionIds = this.getPermissionIdsFromKeys(finalPermissions);
    console.log('Selected permission keys:', finalPermissions);
    console.log('Mapped permission IDs:', permissionIds);

    if (permissionIds.length === 0) {
      alert('No valid permissions selected or permission IDs missing!');
      return;
    }

    this.roleService.assignPermissionsToRole(Number(this.selectedRole.id), permissionIds).subscribe({
      next: () => {
        // After saving, refresh JWT and permissions
        this.authService.refreshToken().subscribe((res: any) => {
          if (res && res.accessToken) {
            localStorage.setItem('jwtToken', res.accessToken);
            // Parse permissions from new token (assuming permissions are in payload)
            const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
            if (payload.permissions) {
              this.permissionService.setPermissions(payload.permissions);
              localStorage.setItem('userPermissions', JSON.stringify(payload.permissions));
            }
          }
          alert('Permissions updated successfully. Your permissions have been refreshed.');
        });
        
        // Update the master list after a successful save
        const originalRole = this.allRoles.find(r => r.id === this.selectedRole!.id);
        if (originalRole) {
          originalRole.permissions = finalPermissions;
          originalRole.updatedAt = new Date();
        }
        // Also update the selectedRole so the UI is consistent if the user continues editing
        if (this.selectedRole) {
          this.selectedRole.permissions = finalPermissions;
        }
      },
      error: (err) => console.error('Error updating permissions:', err)
    });
  }

  // Utility methods
  isObject(val: any): val is { name: string; description?: string } {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  getPreviewedTemplatePermissionsByCategory() {
    if (!this.previewedTemplate || !this.previewedTemplate.permissions) return [];
    // Use permissionCategories from backend for grouping
    const result: { category: string, permissions: any[] }[] = [];
    const templatePerms = this.previewedTemplate.permissions;
    for (const cat of this.permissionCategories) {
      // Find permissions in the template that match this category by key
      const permsInCat = templatePerms.filter(perm => {
        if (typeof perm === 'string') {
          return cat.permissions.some(p => p.key === perm);
        } else if (this.isObject(perm) && (perm as any).key) {
          return cat.permissions.some(p => p.key === (perm as any).key);
        }
        return false;
      });
      if (permsInCat.length > 0) {
        result.push({ category: cat.name, permissions: permsInCat });
      }
    }
    return result;
  }

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

  getPermissionLevelFromCount(count: number): 'basic' | 'intermediate' | 'advanced' | 'critical' {
    if (count >= 80) return 'critical';
    if (count >= 60) return 'advanced';
    if (count >= 30) return 'intermediate';
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
    return this.assignedUsersList.slice(0, 3);
  }

  viewAssignedUsers(): void {
    // Modal would be triggered via Bootstrap JS or Angular CDK
    this.showAssignedUsersModal = true;
  }

  closeAssignedUsersModal(): void {
    this.showAssignedUsersModal = false;
  }

  removeUserFromRole(user: User): void {
    if (confirm(`Remove ${user.name} from this role?`)) {
      this.assignedUsersList = this.assignedUsersList.filter(u => u.id !== user.id);
      if (this.selectedRole) {
        this.selectedRole.userCount = Math.max(0, this.selectedRole.userCount - 1);
      }
      console.log('User removed from role:', user);
    }
  }

  assignUsersToRole(): void {
    console.log('This method is being deprecated, use openAssignDialog instead.');
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
    const headers = [
      'Role Name',
      'Description',
      'Status',
      'Users Assigned',
      'Permissions Count',
      'Permissions',
      'Users',
      'Created Date'
    ];
    const allPermissions = this.getAllPermissions();
    const getPermissionName = (key: string) => {
      const perm = allPermissions.find(p => p.key === key);
      return perm ? perm.name : key;
    };
    const getUserEmails = (roleName: string) => {
      // Find users assigned to this role by matching role name (if available)
      // If you have a mapping of user to role, update this logic accordingly
      // For now, leave blank as User interface does not have role info
      return '';
    };
    const rows = this.allRoles.map(role => [
      role.name,
      role.description,
      role.status,
      role.userCount.toString(),
      role.permissions.length.toString(),
      (role.permissions || []).map((key: any) => typeof key === 'string' ? getPermissionName(key) : (key.name || key.key)).join('; '),
      getUserEmails(role.name),
      role.createdAt.toISOString().split('T')[0]
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  trackByRoleId(index: number, role: Role): string {
    return role.id.toString();
  }

  trackByPermissionKey(index: number, permission: Permission): string {
    return permission.key;
  }

  openTemplatesModal(): void {
    this.showTemplatesModal = true;
  }

  closeTemplatesModal(): void {
    this.showTemplatesModal = false;
  }

  openAssignedUsersModal(content: any): void {
    this.modalService.open(content, { size: 'lg' });
  }

  openAssignDialog(currentModal?: any): void {
    if (currentModal) {
      currentModal.close();
    }
    this.userAssignmentSearchTerm = '';
    this.filterAllUsers();
    this.showAssignUsersDialog = true;
  }

  closeAssignDialog(): void {
    this.showAssignUsersDialog = false;
  }

  filterAllUsers(): void {
    const assignedUserIds = new Set(this.assignedUsersList.map(u => u.id));
    let usersToFilter = this.allUsers.filter(user => !assignedUserIds.has(user.id));

    if (this.userAssignmentSearchTerm) {
      const searchTerm = this.userAssignmentSearchTerm.toLowerCase();
      usersToFilter = usersToFilter.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }
    
    this.filteredAllUsers = usersToFilter;
  }

  toggleUserForAssignment(userId: number): void {
    this.selectedUsersForAssignment[userId] = !this.selectedUsersForAssignment[userId];
  }

  isUserSelectedForAssignment(userId: number): boolean {
    return !!this.selectedUsersForAssignment[userId];
  }

  saveUserAssignments(): void {
    if (!this.selectedRole) return;
    const userIdsToAssign = Object.keys(this.selectedUsersForAssignment)
      .filter(key => this.selectedUsersForAssignment[+key])
      .map(key => +key);

    if (userIdsToAssign.length === 0) {
      alert('No users selected.');
      return;
    }

    const assignmentObservables = userIdsToAssign.map(userId =>
      this.roleService.assignRoleToUser(userId, this.selectedRole!.id)
    );

    forkJoin(assignmentObservables).subscribe({
      next: () => {
        alert('Users assigned successfully!');
        this.loadAssignedUsers(this.selectedRole!.id);
        this.selectedUsersForAssignment = {};
      },
      error: (err) => {
        console.error('Error assigning users:', err);
        alert('An error occurred while assigning users.');
      }
    });
    this.closeAssignDialog();
  }

  getRolePermissionCount(role: Role): number {
    let count = 0;
    const permissionKeys = (role.permissions ?? []).map((perm: any) =>
      typeof perm === 'string' ? perm.toLowerCase().trim() : (perm.key?.toLowerCase().trim() ?? '')
    );
    for (const key of this.getAllPermissionKeys()) {
      if (permissionKeys.includes(key.toLowerCase().trim())) count++;
    }
    return count;
  }

  getLucideCategoryIcon(icon: string): string {
    // Map common FontAwesome/legacy icons to Lucide equivalents
    const map: { [key: string]: string } = {
      'fa-users': 'users',
      'fa-user': 'user',
      'fa-user-cog': 'user-cog',
      'fa-user-tag': 'user-tag',
      'fa-user-shield': 'shield',
      'fa-key': 'key',
      'fa-cogs': 'settings',
      'fa-list': 'list',
      'fa-lock': 'lock',
      'fa-eye': 'eye',
      'fa-chart-bar': 'bar-chart',
      'fa-database': 'database',
      'fa-box': 'box',
      'fa-shopping-cart': 'shopping-cart',
      'fa-credit-card': 'credit-card',
      'fa-envelope': 'mail',
      'fa-bell': 'bell',
      'fa-file-alt': 'file-text',
      'fa-clipboard': 'clipboard',
      'fa-calendar': 'calendar',
      'fa-globe': 'globe',
      'fa-star': 'star',
      'fa-shield-alt': 'shield',
      'fa-cube': 'cube',
      'fa-users-cog': 'users',
      'fa-user-edit': 'user',
      'fa-user-plus': 'user-plus',
      'fa-user-times': 'user-x',
      'fa-user-lock': 'lock',
      'fa-user-check': 'user-check',
      'fa-user-friends': 'users',
      'fa-user-circle': 'user',
      'fa-user-secret': 'user',
      'fa-user-md': 'user',
      'fa-user-nurse': 'user',
      'fa-user-graduate': 'user',
      'fa-user-tie': 'user',
      'fa-user-alt': 'user',
      'fa-user-alt-slash': 'user-x',
      'fa-user-clock': 'clock',
      'fa-user-crown': 'crown',
      'fa-user-gear': 'settings',
      'fa-user-group': 'users',
      'fa-user-slash': 'user-x',
      'fa-user-xmark': 'user-x',
      'fa-users-gear': 'users',
      'fa-users-slash': 'users',
      'fa-users-viewfinder': 'users',
      'fa-cog': 'settings',
      'fa-wrench': 'wrench',
      'fa-tools': 'wrench',
      'fa-unlock': 'unlock',
      'fa-unlock-alt': 'unlock',
      'fa-tasks': 'list-check',
      'fa-clipboard-list': 'clipboard-list',
      'fa-clipboard-check': 'clipboard-check',
      'fa-file': 'file',
      'fa-chart-line': 'line-chart',
      'fa-chart-pie': 'pie-chart',
      'fa-chart-area': 'area-chart',
    };
    if (icon && icon.startsWith('fa-') && map[icon]) return map[icon];
    if (icon && icon in map) return map[icon];
    if (icon && icon in (window as any)['lucide']?.icons) return icon;
    return 'folder'; // fallback
  }

  togglePreviewCategory(index: number) {
    console.log('Toggling category', index, 'Current state:', this.expandedPreviewCategories[index]);
    this.expandedPreviewCategories[index] = !this.expandedPreviewCategories[index];
  }

  toggleDropdown(role: Role): void {
    if (this.currentUser.role.level > role.level) {
      this.openDropdownId = this.openDropdownId === role.id ? null : role.id;
    }
  }

  onEditRole(role: Role): void {
    if (this.currentUser.role.level > role.level) {
      this.editRole(role);
      this.openDropdownId = null;
    }
  }

  onDuplicateRole(role: Role): void {
    if (this.currentUser.role.level > role.level) {
      this.duplicateRole(role);
      this.openDropdownId = null;
    }
  }

  onToggleRoleStatus(role: Role): void {
    if (this.currentUser.role.level > role.level) {
      this.toggleRoleStatus(role);
      this.openDropdownId = null;
    }
  }

  onDeleteRole(role: Role): void {
    if (this.currentUser.role.level > role.level) {
      this.deleteRole(role);
      this.openDropdownId = null;
    }
  }
}