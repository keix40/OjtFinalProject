import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthGuard } from './auth/guards/auth.guard.service';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { CartPageComponent } from './cart-page/cart-page.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { PaymentComponent } from './payment/payment.component';
import { OrderConfirmComponent } from './order-confirm/order-confirm.component';
import { ProductComponent } from './product/product.component';
import { ProductMangementComponent } from './product-mangement/product-mangement.component';
import { LayoutComponent } from './layout/layout.component';
import { ProductDisplayComponent } from './product-display/product-display.component';
import { OrderManagementComponent } from './order-management/order-management.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { OrderTrackingComponent } from './order-tracking/order-tracking.component';
import { ProductDetailComponent } from './admin/product-detail/product-detail.component';
import { UserProductDetailComponent } from './user-product-detail/user-product-detail.component';
import { ReviewComponent } from './review/review.component';
import { CustomersComponent } from './customers/customers.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { ActivityLogsComponent } from './activity-logs/activity-logs.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { RolesPermissionsComponent } from './roles-permissions/roles-permissions.component';
import { VipCustomersComponent } from './vip-customers/vip-customers.component';
import { BlacklistComponent } from './blacklist/blacklist.component';
import { LoginAttemptsComponent } from './login-attempts/login-attempts.component';
import { DiscountEventManagementComponent } from './discount-management/discount-management.component';
import { DiscountInsertComponent } from './discount-insert/discount-insert.component';
import { DiscountCouponComponent } from './discount-coupon/discount-coupon.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserProductListComponent } from './user-product-list/user-product-list';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReturnRequestComponent } from './return-request/return-request.component';
import { ReturnListComponent } from './return-list/return-list.component';
import { ReturnDetailComponent } from './return-detail/return-detail.component';
import { VerifyOtpComponent } from './auth/verify-otp/verify-otp.component';
import { CategoryListComponent } from './category-list/category-list.component';
import { BrandListComponent } from './brand-list/brand-list.component';
import { CategoryAddSubcategoryComponent } from './category-add-subcategory/category-add-subcategory.component';
import { UserCategoryListComponent } from './user-category-list/user-category-list.component';
import { UserBrandListComponent } from './user-brand-list/user-brand-list.component';
import { BannedPageComponent } from './banned-page.component';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IpService } from './services/ip.service';
import { LoginAttemptsService } from './services/login-attempts.service';
import { ProductEditComponent } from './product-edit/product-edit.component';
import { RevenueTargetAdminComponent } from './revenue-target-admin/revenue-target-admin.component';


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
import { CreateDeliveryServiceComponent } from './create-delivery-service/create-delivery-service.component';
import { DeliveryServiceListComponent } from './delivery-service-list/delivery-service-list.component';

const routes: Routes = [
  { path: 'banned', component: BannedPageComponent },
  { path: 'home', component: HomeComponent, canActivate: [BlockedGuard] },
  { path: 'login', component: LoginComponent, canActivate: [BlockedGuard] },
  { path: 'register', component: RegisterComponent, data: { breadcrumb: 'Register' } },
  { path: 'userproductlist', component: UserProductListComponent, data: { breadcrumb: 'ProductList' } },
  { path: 'profile/:userId', component: UserProfileComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Profile' } },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'product', component: ProductComponent },
      { path: 'productlist', component: ProductMangementComponent },
      { path: 'admin/products/:id', component: ProductDetailComponent },
      { path: 'orders', component: OrderManagementComponent },
      {path: 'discount-add', component: DiscountInsertComponent},
      {path: 'discount-list', component:DiscountEventManagementComponent},
      {path: 'discount-coupon', component:DiscountCouponComponent},
      { path: 'product', component: ProductComponent, data: { breadcrumb: 'Products' } },
      { path: 'productlist', component: ProductMangementComponent, data: { breadcrumb: 'Product List' } },
      { path: 'admin/products/:id', component: ProductDetailComponent, data: { breadcrumb: 'Admin Product Detail' } },
      { path: 'orders', component: OrderManagementComponent, data: { breadcrumb: 'Orders' } },
      // add more routes here
    ],},
  { path: 'cart', component: CartPageComponent, data: { breadcrumb: 'Shopping Cart' } },
  { path: 'checkout', component: CheckoutComponent, data: { breadcrumb: 'Checkout' } },
  { path: 'checkout/payment', component: PaymentComponent, data: { breadcrumb: 'Payment' } },
  { path: 'checkout/confirm', component: OrderConfirmComponent, data: { breadcrumb: 'Order Confirmation' } },
  { path: 'display', component: ProductDisplayComponent, data: { breadcrumb: 'Product Display' } },
  { path: 'wishlist', component: WishlistComponent, data: { breadcrumb: 'Wishlist' } },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'product', component: ProductComponent, data: { breadcrumb: 'Products' } },
      { path: 'dashboard', component: DashboardComponent, data: { breadcrumb: 'Products' } },
      { path: 'productlist', component: ProductMangementComponent, data: { breadcrumb: 'Product List' } },
      { path: 'admin/products/:id', component: ProductDetailComponent, data: { breadcrumb: 'Admin Product Detail' } },
      { path: 'users/customers', component: CustomersComponent, data: { breadcrumb: 'Customers' } },
      { path: 'users/create', component: CreateUserComponent ,canActivate: [AuthGuard],
        data: { breadcrumb: 'Create User', permission: 'Users Create' }},
      { path: 'users/activity', component: ActivityLogsComponent, data: { breadcrumb: 'Activity Logs' }},
      { path: 'users/admins', component: AdminUsersComponent, data: { breadcrumb: 'Admins' }},
      { path: 'users/roles', component: RolesPermissionsComponent, data: { breadcrumb: 'Roles & Permissions' }},
      { path: 'users/vip', component: VipCustomersComponent, data: { breadcrumb: 'VIP Customers' }},
      { path: 'users/blacklist', component: BlacklistComponent, data: { breadcrumb: 'Blacklist' }},
      { path: 'users/login-attempts', component: LoginAttemptsComponent, data: { breadcrumb: 'Login Attempts' }},
      { path: 'return', component: ReturnListComponent },
      { path: 'return/:id', component: ReturnDetailComponent },
      { path: 'categorylist', component: CategoryListComponent},
      { path: 'brandlist', component: BrandListComponent},
      { path: 'categorylist', component: CategoryListComponent},
      { path: 'addsubcategory/:parentId', component: CategoryAddSubcategoryComponent },
      { path: 'revenue-target-admin', component: RevenueTargetAdminComponent },
      { path: 'createdeliveryservice', component: CreateDeliveryServiceComponent },
      { path: 'deliveryservicelist', component: DeliveryServiceListComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: 'ordertracking/:orderId', component: OrderTrackingComponent,canActivate: [AuthGuard] , data: { breadcrumb: 'Order Tracking' } },
  // { path: 'user-product-detail/:id', component: UserProductDetailComponent,canActivate: [AuthGuard], data: { breadcrumb: 'Product Detail' } },
  { path: 'product/:id', component: UserProductDetailComponent, data: { breadcrumb: 'Product Detail' } },
  { path: 'product-edit/:id', component: ProductEditComponent  },
  { path: 'review', component: ReviewComponent, data: { breadcrumb: 'Review' } },
  { path: 'review', component: ReviewComponent },
  { path: 'return-request', component: ReturnRequestComponent }, 
  { path: 'verify-otp', component: VerifyOtpComponent },  { path: 'usercategorylist', component: UserCategoryListComponent },
  { path: 'userbrandlist', component: UserBrandListComponent },
  
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

