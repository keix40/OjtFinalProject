import { NgModule } from '@angular/core';
import { RouterModule, Routes, CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Guards and Services
import { AuthGuard } from './auth/guards/auth.guard.service';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionConstants } from './constants/permission.constants';
import { IpService } from './services/ip.service';
import { LoginAttemptsService } from './services/login-attempts.service';

// Auth Components
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { VerifyOtpComponent } from './auth/verify-otp/verify-otp.component';
import { LoggedInGuard } from './auth/guards/logged-in.guard';

// User Components
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserProductDetailComponent } from './user-product-detail/user-product-detail.component';
import { UserProductListComponent } from './user-product-list/user-product-list';
import { UserCategoryListComponent } from './user-category-list/user-category-list.component';
import { UserBrandListComponent } from './user-brand-list/user-brand-list.component';
import { UserPolicyComponent } from './user-policy/user-policy.component';

// Cart and Checkout Components
import { CartPageComponent } from './cart-page/cart-page.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { PaymentComponent } from './payment/payment.component';
import { OrderConfirmComponent } from './order-confirm/order-confirm.component';
import { OrderTrackingComponent } from './order-tracking/order-tracking.component';

// Product Components
import { ProductComponent } from './product/product.component';
import { ProductMangementComponent } from './product-mangement/product-mangement.component';
import { ProductDisplayComponent } from './product-display/product-display.component';
import { ProductDetailComponent } from './admin/product-detail/product-detail.component';
import { CategoryListComponent } from './category-list/category-list.component';
import { BrandListComponent } from './brand-list/brand-list.component';
import { CategoryAddSubcategoryComponent } from './category-add-subcategory/category-add-subcategory.component';

// Order and Return Components
import { OrderManagementComponent } from './order-management/order-management.component';
import { ReturnRequestComponent } from './return-request/return-request.component';
import { ReturnListComponent } from './return-list/return-list.component';
import { ReturnDetailComponent } from './return-detail/return-detail.component';

// Wishlist and Review Components
import { WishlistComponent } from './wishlist/wishlist.component';
import { ReviewComponent } from './review/review.component';

// Admin Components
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminProfileComponent } from './admin-profile/admin-profile.component';
import { AdminPolicyComponent } from './admin-policy/admin-policy.component';
import { AdminPolicyEditComponent } from './admin-policy/admin-policy-edit.component';

// User Management Components
import { CustomersComponent } from './customers/customers.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { ActivityLogsComponent } from './activity-logs/activity-logs.component';
import { RolesPermissionsComponent } from './roles-permissions/roles-permissions.component';
import { VipCustomersComponent } from './vip-customers/vip-customers.component';
import { VipTiersAdminComponent } from './vip-customers/vip-tiers-admin.component';
import { BlacklistComponent } from './blacklist/blacklist.component';
import { BlacklistBlockedComponent } from './blacklist/blacklist-blocked.component';
import { LoginAttemptsComponent } from './login-attempts/login-attempts.component';

// Discount Components
import { DiscountEventManagementComponent } from './discount-management/discount-management.component';
import { DiscountInsertComponent } from './discount-insert/discount-insert.component';
import { DiscountCouponComponent } from './discount-coupon/discount-coupon.component';

// Delivery Components
import { CreateDeliveryServiceComponent } from './create-delivery-service/create-delivery-service.component';
import { DeliveryServiceListComponent } from './delivery-service-list/delivery-service-list.component';

// Event Components
import { CreateEventComponent } from './create-event/create-event.component';
import { EventListComponent } from './event-list/event-list.component';

// Other Components
import { HomeComponent } from './home/home.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { BannedPageComponent } from './banned-page.component';
import { RevenueTargetAdminComponent } from './revenue-target-admin/revenue-target-admin.component';
import { AuthService } from './auth/auth.service';


@Injectable({ providedIn: 'root' })
export class BlockedGuard implements CanActivate {
  constructor(private ipService: IpService, private loginAttemptsService: LoginAttemptsService, private router: Router) {}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return new Promise(resolve => {
      this.ipService.getPublicIp().subscribe(ip => {
        if (ip) {
          this.loginAttemptsService.isIPBlocked(ip).subscribe(res => {
            if (res.blocked) {
              resolve(this.router.createUrlTree(['/banned'], { queryParams: { until: res.blockedUntil } }));
            } else {
              resolve(true);
            }
          });
        } else {
          resolve(true);
        }
      });
    });
  }
}



@Injectable({ providedIn: 'root' })
export class BlacklistGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    console.log('[BlacklistGuard] Checking route:', state.url);
    console.log('[BlacklistGuard] localStorage blacklisted:', localStorage.getItem('blacklisted'));
    console.log('[BlacklistGuard] isLoggedIn:', this.authService.isLoggedIn());
    
    // Priority 1: Check localStorage first (for immediate response)
    if (localStorage.getItem('blacklisted') === 'true') {
      console.log('[BlacklistGuard] User is blacklisted in localStorage, redirecting to blacklist-blocked');
      if (state.url !== '/blacklist-blocked') {
        return this.router.createUrlTree(['/blacklist-blocked'], { 
          queryParams: {
            reason: localStorage.getItem('blacklistReason') || '',
            expiryDate: localStorage.getItem('blacklistExpiryDate') || '',
            banType: localStorage.getItem('banType') || 'Temporary',
            isPermanent: localStorage.getItem('isPermanent') || 'false'
          }
        });
      }
      return true; // Allow access to blacklist-blocked page
    }
    
    // Priority 2: For logged-in users without localStorage flag, check with backend
    if (this.authService.isLoggedIn()) {
      console.log('[BlacklistGuard] User is logged in, checking with backend...');
      return new Promise<boolean | UrlTree>((resolve) => {
        this.authService.checkBlacklistStatus().subscribe({
          next: (response) => {
            console.log('[BlacklistGuard] Backend response:', response);
            if (response.blacklisted) {
              console.log('[BlacklistGuard] User is blacklisted by backend, setting flags and redirecting');
              // User is blacklisted, set flags and redirect
              localStorage.setItem('blacklisted', 'true');
              localStorage.setItem('blacklistReason', response.reason || '');
              localStorage.setItem('blacklistExpiryDate', response.expiryDate || '');
              localStorage.setItem('banType', response.banType || 'Temporary');
              localStorage.setItem('isPermanent', response.isPermanent ? 'true' : 'false');
              
              resolve(this.router.createUrlTree(['/blacklist-blocked'], { 
                queryParams: {
                  reason: response.reason || '',
                  expiryDate: response.expiryDate || '',
                  banType: response.banType || 'Temporary',
                  isPermanent: response.isPermanent || false
                }
              }));
            } else {
              console.log('[BlacklistGuard] User is not blacklisted, allowing access');
              // User is not blacklisted, clear any existing flags
              this.authService.clearBlacklistFlags();
              resolve(true);
            }
          },
          error: (error) => {
            console.error('[BlacklistGuard] Failed to check blacklist status:', error);
            // If backend check fails, allow access (fail-safe)
            resolve(true);
          }
        });
      });
    }
    
    console.log('[BlacklistGuard] User is not logged in, allowing access');
    return true;
  }
}import { UserCouponListComponent } from './user-profile/user-coupon-list/user-coupon-list.component';


const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent, canActivate: [LoggedInGuard], data: { role: 'customer' } },
  { path: 'register', component: RegisterComponent, canActivate: [LoggedInGuard], data: { breadcrumb: 'Register', role: 'customer' } },
  { path: 'verify-otp', component: VerifyOtpComponent, data: { role: 'customer' } },
  { path: 'blacklist-blocked', component: BlacklistBlockedComponent, data: { role: 'customer' } },
  { path: 'banned', component: BannedPageComponent, data: { role: 'customer' } },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard, BlacklistGuard] ,data: { role: 'customer' }},
  { path: 'about-us', component: AboutUsComponent, data: { breadcrumb: 'About Us', role: 'customer' } },
  { path: 'contact-us', component: ContactUsComponent, data: { breadcrumb: 'Contact Us', role: 'customer' } },
  { path: 'user/policies', component: UserPolicyComponent, data: { breadcrumb: 'User Policies', role: 'customer' } },

  // Customer routes (require AuthGuard and BlacklistGuard)
  { path: 'cart', component: CartPageComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Shopping Cart', role: 'customer' } },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Checkout', role: 'customer' } },
  { path: 'checkout/payment', component: PaymentComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Payment', role: 'customer' } },
  { path: 'checkout/confirm', component: OrderConfirmComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Order Confirmation', role: 'customer' } },
  { path: 'display', component: ProductDisplayComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Product Display', role: 'customer' } },
  { path: 'wishlist', component: WishlistComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Wishlist', role: 'customer' } },
  { path: 'userproductlist', component: UserProductListComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'ProductList', role: 'customer' } },
  { path: 'product/:id', component: UserProductDetailComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Product Detail', role: 'customer' } },
  { path: 'review', component: ReviewComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Review', role: 'customer' } },
  { path: 'return-request', component: ReturnRequestComponent, canActivate: [AuthGuard, BlacklistGuard], data: { role: 'customer' } },
  { path: 'usercategorylist', component: UserCategoryListComponent, canActivate: [AuthGuard, BlacklistGuard], data: { role: 'customer' } },
  { path: 'userbrandlist', component: UserBrandListComponent, canActivate: [AuthGuard, BlacklistGuard], data: { role: 'customer' } },
  { path: 'ordertracking/:orderId', component: OrderTrackingComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Order Tracking', role: 'customer' } },
  { path: 'profile/:userId', component: UserProfileComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Profile', role: 'customer' } },

  // Admin routes (require AuthGuard, BlacklistGuard, and PermissionGuard)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard, BlacklistGuard],
    data: { role: 'admin' },
    children: [
      { path: 'dashboard', component: DashboardComponent, data: { breadcrumb: 'Dashboard', role: 'admin' } },
      // Products
      { path: 'product', component: ProductComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Products', permission: PermissionConstants.PRODUCTS_CREATE, role: 'admin' } },
      { path: 'product-edit/:id', component: ProductComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Edit Product', permission: PermissionConstants.PRODUCTS_UPDATE, role: 'admin' } },
      { path: 'productlist', component: ProductMangementComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Product List', permission: PermissionConstants.PRODUCTS_VIEW, role: 'admin' } },
      { path: 'admin/products/:id', component: ProductDetailComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Admin Product Detail', permission: PermissionConstants.PRODUCTS_VIEW, role: 'admin' } },
      { path: 'categorylist', component: CategoryListComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Categories', permission: PermissionConstants.CATEGORIES_VIEW, role: 'admin' } },
      { path: 'brandlist', component: BrandListComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Brands', permission: PermissionConstants.BRANDS_VIEW, role: 'admin' } },
      { path: 'addsubcategory/:parentId', component: CategoryAddSubcategoryComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Add Subcategory', permission: PermissionConstants.CATEGORIES_CREATE, role: 'admin' } },
      // Orders
      { path: 'orders', component: OrderManagementComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Orders', permission: PermissionConstants.ORDERS_VIEW, role: 'admin' } },
      { path: 'return', component: ReturnListComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Returns', permission: PermissionConstants.REFUND_VIEW, role: 'admin' } },
      { path: 'return/:id', component: ReturnDetailComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Return Detail', permission: PermissionConstants.REFUND_VIEW, role: 'admin' } },
      // Discounts
      { path: 'discount-add', component: DiscountInsertComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Add Discount', permission: PermissionConstants.DISCOUNTS_CREATE, role: 'admin' } },
      { path: 'discount-list', component: DiscountEventManagementComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Discount List', permission: PermissionConstants.DISCOUNTS_VIEW, role: 'admin' } },
      { path: 'discount-coupon', component: DiscountCouponComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Discount Coupons', permission: PermissionConstants.DISCOUNTS_CREATE, role: 'admin' } },
      // Delivery
      { path: 'createdeliveryservice', component: CreateDeliveryServiceComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Create Delivery Service', permission: PermissionConstants.DELIVERY_CREATE, role: 'admin' } },
      { path: 'deliveryservicelist', component: DeliveryServiceListComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Delivery Services', permission: PermissionConstants.DELIVERY_VIEW, role: 'admin' } },
      // User Management
      { path: 'users/customers', component: CustomersComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Customers', permission: PermissionConstants.CUSTOMERS_VIEW, role: 'admin' } },
      { path: 'users/vip', component: VipCustomersComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'VIP Customers', permission: PermissionConstants.CUSTOMERS_VIEW_VIP, role: 'admin' } },
      { path: 'users/create', component: CreateUserComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Create User', permission: PermissionConstants.USERS_CREATE, role: 'admin' } },
      { path: 'users/admins', component: AdminUsersComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Admins', permission: PermissionConstants.ADMIN_USERS_VIEW, role: 'admin' } },
      { path: 'users/roles', component: RolesPermissionsComponent, data: { breadcrumb: 'Roles & Permissions', permission: PermissionConstants.PERMISSIONS_VIEW, role: 'admin' } },
      { path: 'users/blacklist', component: BlacklistComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Blacklist', permission: PermissionConstants.BLACKLIST_VIEW, role: 'admin' } },
      { path: 'users/login-attempts', component: LoginAttemptsComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Login Attempts', permission: PermissionConstants.SECURITY_VIEW_ATTEMPTS, role: 'admin' } },
      { path: 'users/activity', component: ActivityLogsComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Activity Logs', permission: PermissionConstants.ACTIVITY_LOGS_VIEW, role: 'admin' } },
      // Admin Settings
      { path: 'revenue-target-admin', component: RevenueTargetAdminComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Revenue Target',} },
      { path: 'admin/vip-tiers', component: VipTiersAdminComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'VIP Tiers'} },
      { path: 'admin/policies', component: AdminPolicyComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Policies', role: 'admin' } },
      { path: 'admin/policies/edit/:id', component: AdminPolicyEditComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Edit Policy' } },
      { path: 'admin/profile/:id', component: AdminProfileComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Profile' } },

      //Event Management
      { path: 'admin/event', component: CreateEventComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Create Event', permission: PermissionConstants.DISCOUNTS_CREATE, role: 'admin' } },
      { path: 'admin/event/:id', component: CreateEventComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Edit Event', permission: PermissionConstants.DISCOUNTS_CREATE } },
      { path: 'admin/eventlist', component: EventListComponent, canActivate: [PermissionGuard], data: { breadcrumb: 'Event List', permission: PermissionConstants.DISCOUNTS_VIEW, role: 'admin' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' }),
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }