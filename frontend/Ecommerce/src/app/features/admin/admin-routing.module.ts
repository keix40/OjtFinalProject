import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../auth/guards/auth.guard.service';
import { PermissionGuard } from '../../guards/permission.guard';
import { PermissionConstants } from '../../constants/permission.constants';
import { BlacklistGuard } from '../../guards/blacklist.guard';
import { LayoutComponent } from '../../layout/layout.component';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { ProductComponent } from '../../product/product.component';
import { ProductMangementComponent } from '../../product-mangement/product-mangement.component';
import { ProductDetailComponent } from '../../admin/product-detail/product-detail.component';
import { CategoryListComponent } from '../../category-list/category-list.component';
import { BrandListComponent } from '../../brand-list/brand-list.component';
import { CategoryAddSubcategoryComponent } from '../../category-add-subcategory/category-add-subcategory.component';
import { OrderManagementComponent } from '../../order-management/order-management.component';
import { ReturnListComponent } from '../../return-list/return-list.component';
import { ReturnDetailComponent } from '../../return-detail/return-detail.component';
import { DiscountInsertComponent } from '../../discount-insert/discount-insert.component';
import { DiscountEventManagementComponent } from '../../discount-management/discount-management.component';
import { DiscountCouponComponent } from '../../discount-coupon/discount-coupon.component';
import { CreateDeliveryServiceComponent } from '../../create-delivery-service/create-delivery-service.component';
import { DeliveryServiceListComponent } from '../../delivery-service-list/delivery-service-list.component';
import { CustomersComponent } from '../../customers/customers.component';
import { VipCustomersComponent } from '../../vip-customers/vip-customers.component';
import { CreateUserComponent } from '../../create-user/create-user.component';
import { AdminUsersComponent } from '../../admin-users/admin-users.component';
import { RolesPermissionsComponent } from '../../roles-permissions/roles-permissions.component';
import { BlacklistComponent } from '../../blacklist/blacklist.component';
import { LoginAttemptsComponent } from '../../login-attempts/login-attempts.component';
import { ActivityLogsComponent } from '../../activity-logs/activity-logs.component';
import { RevenueTargetAdminComponent } from '../../revenue-target-admin/revenue-target-admin.component';
import { VipTiersAdminComponent } from '../../vip-customers/vip-tiers-admin.component';
import { AdminPolicyComponent } from '../../admin-policy/admin-policy.component';
import { AdminPolicyEditComponent } from '../../admin-policy/admin-policy-edit.component';
import { AdminProfileComponent } from '../../admin-profile/admin-profile.component';
import { CreateEventComponent } from '../../create-event/create-event.component';
import { EventListComponent } from '../../event-list/event-list.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard, BlacklistGuard],
    data: { role: 'admin' },
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Dashboard', permission: PermissionConstants.ORDERS_VIEW, role: 'admin' } },
      { path: 'product', component: ProductComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Products', permission: PermissionConstants.PRODUCTS_CREATE, role: 'admin' } },
      { path: 'product-edit/:id', component: ProductComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Edit Product', permission: PermissionConstants.PRODUCTS_UPDATE, role: 'admin' } },
      { path: 'productlist', component: ProductMangementComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Product List', permission: PermissionConstants.PRODUCTS_VIEW, role: 'admin' } },
      { path: 'admin/products/:id', component: ProductDetailComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Admin Product Detail', permission: PermissionConstants.PRODUCTS_VIEW, role: 'admin' } },
      { path: 'categorylist', component: CategoryListComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Categories', permission: PermissionConstants.CATEGORIES_VIEW, role: 'admin' } },
      { path: 'brandlist', component: BrandListComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Brands', permission: PermissionConstants.BRANDS_VIEW, role: 'admin' } },
      { path: 'addsubcategory/:parentId', component: CategoryAddSubcategoryComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Add Subcategory', permission: PermissionConstants.CATEGORIES_CREATE, role: 'admin' } },
      { path: 'orders', component: OrderManagementComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Orders', permission: PermissionConstants.ORDERS_VIEW, role: 'admin' } },
      { path: 'return', component: ReturnListComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Returns', permission: PermissionConstants.REFUND_VIEW, role: 'admin' } },
      { path: 'return/:id', component: ReturnDetailComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Return Detail', permission: PermissionConstants.REFUND_VIEW, role: 'admin' } },
      { path: 'discount-add', component: DiscountInsertComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Add Discount', permission: PermissionConstants.DISCOUNTS_CREATE, role: 'admin' } },
      { path: 'discount-list', component: DiscountEventManagementComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Discount List', permission: PermissionConstants.DISCOUNTS_VIEW, role: 'admin' } },
      { path: 'discount-coupon', component: DiscountCouponComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Discount Coupons', permission: PermissionConstants.DISCOUNTS_CREATE, role: 'admin' } },
      { path: 'createdeliveryservice', component: CreateDeliveryServiceComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Create Delivery Service', permission: PermissionConstants.DELIVERY_CREATE, role: 'admin' } },
      { path: 'deliveryservicelist', component: DeliveryServiceListComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Delivery Services', permission: PermissionConstants.DELIVERY_VIEW, role: 'admin' } },
      { path: 'users/customers', component: CustomersComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Customers', permission: PermissionConstants.CUSTOMERS_VIEW, role: 'admin' } },
      { path: 'users/vip', component: VipCustomersComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'VIP Customers', permission: PermissionConstants.CUSTOMERS_VIEW_VIP, role: 'admin' } },
      { path: 'users/create', component: CreateUserComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Create User', permission: PermissionConstants.USERS_CREATE, role: 'admin' } },
      { path: 'users/admins', component: AdminUsersComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Admins', permission: PermissionConstants.ADMIN_USERS_VIEW, role: 'admin' } },
      { path: 'users/roles', component: RolesPermissionsComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Roles & Permissions', permission: PermissionConstants.PERMISSIONS_VIEW, role: 'admin' } },
      { path: 'users/blacklist', component: BlacklistComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Blacklist', permission: PermissionConstants.BLACKLIST_VIEW, role: 'admin' } },
      { path: 'users/login-attempts', component: LoginAttemptsComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Login Attempts', permission: PermissionConstants.SECURITY_VIEW_ATTEMPTS, role: 'admin' } },
      { path: 'users/activity', component: ActivityLogsComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Activity Logs', permission: PermissionConstants.ACTIVITY_LOGS_VIEW, role: 'admin' } },
      { path: 'revenue-target-admin', component: RevenueTargetAdminComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Revenue Target', permission: PermissionConstants.REVENUE_TARGET_VIEW, role: 'admin' } },
      { path: 'admin/vip-tiers', component: VipTiersAdminComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'VIP Tiers', permission: PermissionConstants.VIP_TIERS_VIEW, role: 'admin' } },
      { path: 'admin/policies', component: AdminPolicyComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Policies', permission: PermissionConstants.POLICIES_VIEW, role: 'admin' } },
      { path: 'admin/policies/edit/:id', component: AdminPolicyEditComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Edit Policy', permission: PermissionConstants.POLICIES_UPDATE, role: 'admin' } },
      { path: 'admin/profile/:id', component: AdminProfileComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Profile' } },
      { path: 'admin/event', component: CreateEventComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Create Event', permission: PermissionConstants.DISCOUNTS_CREATE, role: 'admin' } },
      { path: 'admin/event/:id', component: CreateEventComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Edit Event', permission: PermissionConstants.DISCOUNTS_CREATE } },
      { path: 'admin/eventlist', component: EventListComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Event List', permission: PermissionConstants.DISCOUNTS_VIEW, role: 'admin' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
