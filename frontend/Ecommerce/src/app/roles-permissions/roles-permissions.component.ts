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
import { Observable } from 'rxjs';

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
  currentUser: any = null;

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
    // First, extract user information from JWT token
    this.initializeCurrentUserFromToken();
    
    // Use the correct permission constants
    this.canCreateRole = this.permissionService.hasPermission(PermissionConstants.ROLES_ASSIGN_PERMISSIONS);
    this.canEditRolePermission = this.permissionService.hasPermission(PermissionConstants.ROLES_ASSIGN_PERMISSIONS);
    this.canDeleteRole = this.permissionService.hasPermission(PermissionConstants.ROLES_ASSIGN_PERMISSIONS);
    this.canAssignPermissions = this.permissionService.hasPermission(PermissionConstants.ROLES_ASSIGN_PERMISSIONS);
    
    // Load data after user is initialized
    this.loadRoles();
    this.loadPermissions();
    this.loadAllUsers();
    this.loadPermissionCategories();

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
        // Clear selected role if it becomes inaccessible
        this.clearInaccessibleSelectedRole();
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
    // Show all roles, but they will be disabled in the UI if not accessible
    if (!this.roleSearchTerm.trim()) {
      this.filteredRoles = this.allRoles;
    } else {
      const searchTerm = this.roleSearchTerm.toLowerCase();
      this.filteredRoles = this.allRoles.filter(role =>
        role.name.toLowerCase().includes(searchTerm) ||
        role.description.toLowerCase().includes(searchTerm)
      );
    }
  }

  // Role selection and management
  selectRole(role: Role): void {
    // Prevent selecting roles with higher levels than current user
    if (!this.canSelectRole(role)) {
      console.log('Cannot select role with higher level:', role.name, 'Level:', role.level, 'User level:', this.currentUser.role.level);
      return;
    }

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
    // Users can edit roles with equal or lower levels than their own
    // This allows ADMIN (level 6) to edit ADMIN role, MANAGER (level 5) to edit MANAGER role, etc.
    if (!this.currentUser || !this.currentUser.role) return false;
    return this.currentUser.role.level >= role.level && role.status === 'active';
  }

  canViewRole(role: Role): boolean {
    // Users can ONLY view roles with equal or lower levels than their own
    if (!this.currentUser || !this.currentUser.role) return false;
    return this.currentUser.role.level >= role.level;
  }

  canManageRole(role: Role): boolean {
    // Users can manage (edit/delete) roles with equal or lower levels than their own
    // This allows ADMIN (level 6) to manage ADMIN role, MANAGER (level 5) to manage MANAGER role, etc.
    if (!this.currentUser || !this.currentUser.role) return false;
    return this.currentUser.role.level >= role.level;
  }

  canSelectRole(role: Role): boolean {
    // Users can ONLY select roles with equal or lower levels than their own
    if (!this.currentUser || !this.currentUser.role) return false;
    return this.currentUser.role.level >= role.level;
  }

  // NEW: Completely filter out roles that user cannot access
  getAccessibleRoles(): Role[] {
    // Return all roles - don't filter out higher level roles
    return this.allRoles;
  }

  // NEW: Initialize current user from JWT token
  initializeCurrentUserFromToken(): void {
    const token = localStorage.getItem('token');
    console.log('Token found:', !!token);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT Payload:', payload);
        console.log('JWT Payload keys:', Object.keys(payload));
        
        // Check if required fields exist
        if (payload.id && payload.sub && payload.roles && payload.roleLevel !== undefined) {
          this.currentUser = {
            id: payload.id,
            name: payload.sub,
            role: {
              id: payload.id,
              name: payload.roles,
              level: payload.roleLevel
            }
          };
          console.log('Current User initialized successfully:', this.currentUser);
        } else {
          console.error('Missing required fields in JWT payload');
          console.log('Available fields:', {
            id: payload.id,
            sub: payload.sub,
            roles: payload.roles,
            roleLevel: payload.roleLevel
          });
          // Set fallback with available data
          this.currentUser = {
            id: payload.id || 0,
            name: payload.sub || 'Unknown User',
            role: {
              id: payload.id || 0,
              name: payload.roles || 'UNKNOWN',
              level: payload.roleLevel || 0
            }
          };
        }
      } catch (error) {
        console.error('Error parsing JWT token:', error);
        // If token parsing fails, set a minimal user object
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
      console.error('No access token found in localStorage');
      // If no token, set a minimal user object
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
    
    // Ensure currentUser is never null
    if (!this.currentUser) {
      this.currentUser = {
        id: 0,
        name: 'Fallback User',
        role: {
          id: 0,
          name: 'FALLBACK',
          level: 0
        }
      };
    }
    
    console.log('Final currentUser:', this.currentUser);
  }

  // NEW: Clear selected role if it becomes inaccessible
  clearInaccessibleSelectedRole(): void {
    if (this.selectedRole && !this.canViewRole(this.selectedRole)) {
      console.log('Clearing inaccessible selected role:', this.selectedRole.name);
      this.selectedRole = null;
      this.permissionCheckState.clear();
      this.assignedUsersList = [];
    }
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
    console.log('Debug: Current user role level:', this.currentUser.role.level);
    console.log('Debug: Has USERS_ASSIGN_ROLE permission:', this.permissionService.hasPermission(PermissionConstants.USERS_ASSIGN_ROLE));
    console.log('Debug: Selected role:', this.selectedRole);
    
    if (!this.permissionService.hasPermission(PermissionConstants.USERS_ASSIGN_ROLE)) {
      alert('You do not have permission to assign roles to users.');
      return;
    }
    
    if (!this.selectedRole || !this.canManageRole(this.selectedRole)) {
      alert('You cannot assign users to roles with equal or higher level than your own.');
      return;
    }
    
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
    console.log('=== ROLE ASSIGNMENT DEBUG ===');
    console.log('Debug: Attempting to save user assignments');
    console.log('Debug: Current user ID:', this.currentUser.id);
    console.log('Debug: Current user role level:', this.currentUser.role.level);
    console.log('Debug: Selected role level:', this.selectedRole?.level);
    console.log('Debug: Has USERS_ASSIGN_ROLE permission:', this.permissionService.hasPermission(PermissionConstants.USERS_ASSIGN_ROLE));
    console.log('Debug: Selected users for assignment:', this.selectedUsersForAssignment);
    
    if (!this.permissionService.hasPermission(PermissionConstants.USERS_ASSIGN_ROLE)) {
      alert('You do not have permission to assign roles to users.');
      return;
    }
    
    if (!this.selectedRole || !this.canManageRole(this.selectedRole)) {
      alert('You cannot assign users to roles with higher level than your own.');
      return;
    }
    
    if (!this.selectedRole) return;
    const userIdsToAssign = Object.keys(this.selectedUsersForAssignment)
      .filter(key => this.selectedUsersForAssignment[+key])
      .map(key => +key);

    if (userIdsToAssign.length === 0) {
      alert('No users selected.');
      return;
    }

    console.log('Debug: User IDs to assign:', userIdsToAssign);
    console.log('Debug: Current user will be affected:', userIdsToAssign.includes(this.currentUser.id));

    const assignmentObservables = userIdsToAssign.map(userId =>
      this.roleService.assignRoleToUser(userId, this.selectedRole!.id)
    );

    forkJoin(assignmentObservables).subscribe({
      next: (responses) => {
        console.log('Debug: Role assignment successful');
        console.log('Debug: Assignment responses:', responses);
        
        // Check if current user is among the assigned users
        const currentUserAssigned = userIdsToAssign.includes(this.currentUser.id);
        console.log('Debug: Current user was affected:', currentUserAssigned);
        
        // Check if any response contains a new token (indicating current user was affected)
        let newTokenReceived = false;
        responses.forEach((response: any) => {
          try {
            if (typeof response === 'string') {
              const parsedResponse = JSON.parse(response);
              if (parsedResponse.userAffected && parsedResponse.newToken) {
                console.log('Debug: New token received from backend');
                // Update the token in localStorage
                localStorage.setItem('token', parsedResponse.newToken);
                newTokenReceived = true;
                
                // Verify the new token
                this.verifyNewToken(parsedResponse.newToken);
                
                // Re-initialize current user from the new token
                this.initializeCurrentUserFromToken();
                
                // Refresh permissions
                this.refreshUserPermissions();
              }
            }
          } catch (error) {
            console.log('Debug: Response is not JSON, treating as plain text');
          }
        });
        
        if (currentUserAssigned && !newTokenReceived) {
          console.log('Debug: Current user affected but no new token received, using fallback');
          // If current user's role was changed but no new token received, use fallback
          this.refreshCurrentUserData();
        }
        
        if (currentUserAssigned) {
          // Show special notification for current user role change
          this.showRoleChangeNotification();
        }
        
        // Refresh the assigned users list
        this.loadAssignedUsers(this.selectedRole!.id);
        
        // Update user counts for all roles
        this.loadUserCountsForRoles();
        
        // Clear selection
        this.selectedUsersForAssignment = {};
        
        // Show success message
        const message = currentUserAssigned 
          ? `Users assigned successfully! Your role has been changed to ${this.selectedRole?.name || 'Unknown Role'}.`
          : 'Users assigned successfully!';
        this.showSuccessMessage(message);
        
        console.log('=== ROLE ASSIGNMENT COMPLETE ===');
      },
      error: (err) => {
        console.error('Debug: Error assigning users:', err);
        this.showErrorMessage('An error occurred while assigning users.');
      }
    });
    this.closeAssignDialog();
  }

  // NEW: Method to show role change notification
  showRoleChangeNotification(): void {
    if (!this.selectedRole) return;
    
    const oldRoleLevel = this.currentUser.role.level;
    const newRoleLevel = this.selectedRole.level;
    
    let message = `Your role has been changed to ${this.selectedRole.name}. `;
    
    if (newRoleLevel > oldRoleLevel) {
      message += 'You now have higher privileges.';
    } else if (newRoleLevel < oldRoleLevel) {
      message += 'Your privileges have been reduced.';
    } else {
      message += 'Your privileges remain the same.';
    }
    
    message += '\n\nPlease refresh the page to see all changes take effect.';
    
    if (confirm(message + '\n\nWould you like to refresh the page now?')) {
      window.location.reload();
    }
  }

  // NEW: Method to show success message
  showSuccessMessage(message: string): void {
    // You can replace this with a proper toast notification library
    alert(message);
  }

  // NEW: Method to show error message
  showErrorMessage(message: string): void {
    // You can replace this with a proper toast notification library
    alert('Error: ' + message);
  }

  // NEW: Method to refresh current user's data after role change
  refreshCurrentUserData(): void {
    console.log('Refreshing current user data...');
    
    // First, try to refresh the JWT token to get updated permissions
    this.refreshJWTToken().subscribe({
      next: (tokenResponse) => {
        if (tokenResponse && tokenResponse.accessToken) {
          // Update the token in localStorage
          localStorage.setItem('token', tokenResponse.accessToken);
          console.log('JWT token refreshed successfully');
          
          // Re-initialize current user from the new token
          this.initializeCurrentUserFromToken();
          
          // Refresh permissions
          this.refreshUserPermissions();
        } else {
          // Fallback: get fresh user data from backend
          this.refreshUserDataFromBackend();
        }
      },
      error: (err) => {
        console.error('Error refreshing JWT token:', err);
        console.log('JWT refresh failed, using fallback method...');
        
        // Try to get fresh user data from backend
        this.refreshUserDataFromBackend();
        
        // If that also fails, suggest page reload
        setTimeout(() => {
          if (confirm('Unable to refresh your data automatically. Would you like to reload the page to see your updated role?')) {
            this.forcePageReload();
          }
        }, 2000);
      }
    });
  }

  // NEW: Method to refresh JWT token
  refreshJWTToken(): Observable<any> {
    return this.authService.refreshToken();
  }

  // NEW: Method to force page reload for fresh data
  forcePageReload(): void {
    console.log('Forcing page reload to get fresh data...');
    window.location.reload();
  }

  // NEW: Fallback method to refresh user data from backend
  refreshUserDataFromBackend(): void {
    this.authService.getAllUsers().subscribe({
      next: (users: any[]) => {
        const updatedUser = users.find(u => u.id === this.currentUser.id);
        if (updatedUser) {
          console.log('Updated user data:', updatedUser);
          
          // Update current user with fresh data
          this.currentUser = {
            id: updatedUser.id,
            name: updatedUser.name || updatedUser.email,
            role: {
              id: updatedUser.role?.id || updatedUser.roleId,
              name: updatedUser.role?.name || updatedUser.roleName,
              level: updatedUser.role?.level || updatedUser.roleLevel
            }
          };
          
          // Update localStorage with new user info
          this.updateLocalStorageUserInfo(updatedUser);
          
          // Refresh permissions
          this.refreshUserPermissions();
          
          console.log('Current user data refreshed:', this.currentUser);
        }
      },
      error: (err) => {
        console.error('Error refreshing user data:', err);
      }
    });
  }

  // NEW: Method to update localStorage with fresh user info
  updateLocalStorageUserInfo(userData: any): void {
    try {
      // Get current token
      const token = localStorage.getItem('token');
      if (token) {
        // Decode current token
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Update payload with new role information
        const updatedPayload = {
          ...payload,
          roles: userData.role?.name || userData.roleName,
          roleLevel: userData.role?.level || userData.roleLevel,
          roleId: userData.role?.id || userData.roleId
        };
        
        // Note: We can't modify the JWT token directly as it's signed
        // Instead, we'll store the updated user info separately
        localStorage.setItem('currentUserInfo', JSON.stringify(updatedPayload));
        
        console.log('Updated user info stored in localStorage');
      }
    } catch (error) {
      console.error('Error updating localStorage user info:', error);
    }
  }

  // NEW: Method to refresh user permissions
  refreshUserPermissions(): void {
    // Refresh permissions from the permission service
    this.permissionService.refreshPermissions().subscribe({
      next: (permissions: string[]) => {
        console.log('Permissions refreshed:', permissions);
        // Update permission service with new permissions
        this.permissionService.setPermissions(permissions);
      },
      error: (err: any) => {
        console.error('Error refreshing permissions:', err);
      }
    });
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
    if (this.canSelectRole(role)) {
      this.openDropdownId = this.openDropdownId === role.id ? null : role.id;
    }
  }

  onEditRole(role: Role): void {
    if (this.canManageRole(role)) {
      this.editRole(role);
      this.openDropdownId = null;
    }
  }

  onDuplicateRole(role: Role): void {
    if (this.canManageRole(role)) {
      this.duplicateRole(role);
      this.openDropdownId = null;
    }
  }

  onToggleRoleStatus(role: Role): void {
    if (this.canManageRole(role)) {
      this.toggleRoleStatus(role);
      this.openDropdownId = null;
    }
  }

  onDeleteRole(role: Role): void {
    if (this.canManageRole(role)) {
      this.deleteRole(role);
      this.openDropdownId = null;
    }
  }

  // Debug method to check permissions
  debugPermissions(): void {
    console.log('=== DEBUG PERMISSIONS ===');
    console.log('Current User:', this.currentUser);
    console.log('Current User Role Level:', this.currentUser.role.level);
    console.log('USERS_ASSIGN_ROLE permission:', this.permissionService.hasPermission(PermissionConstants.USERS_ASSIGN_ROLE));
    console.log('ROLES_CREATE permission:', this.permissionService.hasPermission(PermissionConstants.ROLES_CREATE));
    console.log('ROLES_UPDATE permission:', this.permissionService.hasPermission(PermissionConstants.USERS_ASSIGN_ROLE));
    console.log('ROLES_DELETE permission:', this.permissionService.hasPermission(PermissionConstants.USERS_ASSIGN_ROLE));
    console.log('All Roles:', this.allRoles);
    console.log('Accessible Roles:', this.getAccessibleRoles());
    console.log('Filtered Roles:', this.filteredRoles);
    console.log('Selected Role:', this.selectedRole);
    console.log('Can View Selected Role:', this.selectedRole ? this.canViewRole(this.selectedRole) : 'N/A');
    console.log('Can Manage Selected Role:', this.selectedRole ? this.canManageRole(this.selectedRole) : 'N/A');
    console.log('=======================');
  }

  debugJWT(): void {
    console.log('=== DEBUG JWT TOKEN ===');
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');
    console.log('Token (token):', !!token);
    console.log('Token (accessToken):', !!accessToken);
    
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token parts:', token.split('.').length);
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT Payload:', payload);
        console.log('JWT Payload keys:', Object.keys(payload));
        console.log('JWT Payload values:', {
          id: payload.id,
          sub: payload.sub,
          roles: payload.roles,
          roleLevel: payload.roleLevel
        });
      } catch (error) {
        console.error('Error parsing JWT:', error);
      }
    }
    
    console.log('Current User State:', this.currentUser);
    console.log('=======================');
  }

  // NEW: Method to verify and log the new token information
  verifyNewToken(newToken: string): void {
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      console.log('Verified New Token Payload:', payload);
      console.log('Verified New Token ID:', payload.id);
      console.log('Verified New Token Sub:', payload.sub);
      console.log('Verified New Token Roles:', payload.roles);
      console.log('Verified New Token Role Level:', payload.roleLevel);
      
      // Compare with old token information
      this.compareTokenInformation(payload);
    } catch (error) {
      console.error('Error verifying new token payload:', error);
    }
  }

  // NEW: Method to compare old and new token information
  compareTokenInformation(newPayload: any): void {
    const oldToken = localStorage.getItem('token');
    if (oldToken) {
      try {
        const oldPayload = JSON.parse(atob(oldToken.split('.')[1]));
        console.log('=== TOKEN COMPARISON ===');
        console.log('Old Role Level:', oldPayload.roleLevel);
        console.log('New Role Level:', newPayload.roleLevel);
        console.log('Old Roles:', oldPayload.roles);
        console.log('New Roles:', newPayload.roles);
        console.log('Role Level Changed:', oldPayload.roleLevel !== newPayload.roleLevel);
        console.log('Roles Changed:', oldPayload.roles !== newPayload.roles);
        console.log('=======================');
      } catch (error) {
        console.error('Error comparing token information:', error);
      }
    }
  }

  // NEW: Method to test role assignment functionality
  testRoleAssignment(): void {
    console.log('=== TESTING ROLE ASSIGNMENT ===');
    console.log('Current User ID:', this.currentUser.id);
    console.log('Current User Role Level:', this.currentUser.role.level);
    console.log('Current User Role Name:', this.currentUser.role.name);
    console.log('Selected Role ID:', this.selectedRole?.id);
    console.log('Selected Role Level:', this.selectedRole?.level);
    console.log('Selected Role Name:', this.selectedRole?.name);
    console.log('Can Manage Selected Role:', this.canManageRole(this.selectedRole!));
    console.log('Has USERS_ASSIGN_ROLE Permission:', this.permissionService.hasPermission(PermissionConstants.USERS_ASSIGN_ROLE));
    console.log('Current Token:', localStorage.getItem('token')?.substring(0, 50) + '...');
    console.log('==============================');
  }

  // NEW: Method to manually trigger role assignment test
  triggerRoleAssignmentTest(): void {
    if (!this.selectedRole) {
      alert('Please select a role first');
      return;
    }
    
    this.testRoleAssignment();
    
    // Simulate assigning the current user to the selected role
    this.selectedUsersForAssignment[this.currentUser.id] = true;
    this.saveUserAssignments();
  }
}