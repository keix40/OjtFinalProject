import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TestComponent } from './test/test.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { JwtInterceptor } from './interceptors/jwt.interceptors.service';
import { HeaderComponent } from './header/header.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserOrdersComponent } from './user-profile/user-orders/user-orders.component';
import { UserWishlistComponent } from './user-profile/user-wishlist/user-wishlist.component';
import { UserPaymentMethodsComponent } from './user-profile/user-payment-methods/user-payment-methods.component';
import { UserReviewsComponent } from './user-profile/user-reviews/user-reviews.component';
import { UserPersonalInfoComponent } from './user-profile/user-personal-info/user-personal-info.component';
import { ProductComponent } from './product/product.component';
import { ProductMangementComponent } from './product-mangement/product-mangement.component';
import { UserAddressesComponent } from './user-profile/user-addresses/user-addresses.component';
import { UserNotificationsComponent } from './user-profile/user-notifications/user-notifications.component';
import { AddressService } from './services/address.service';
import { AuthService } from './auth/auth.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CreateBrandComponent } from './create-brand/create-brand.component';
import { CreateCategoryComponent } from './create-category/create-category.component';
import { LayoutComponent } from './layout/layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { CartSidebarComponent } from './cart-sidebar/cart-sidebar.component';
import { CartPageComponent } from './cart-page/cart-page.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { PaymentComponent } from './payment/payment.component';
import { OrderConfirmComponent } from './order-confirm/order-confirm.component';
import { ProductDisplayComponent } from './product-display/product-display.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { CustomersComponent } from './customers/customers.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { ActivityLogsComponent } from './activity-logs/activity-logs.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { RolesPermissionsComponent } from './roles-permissions/roles-permissions.component';
import { VipCustomersComponent } from './vip-customers/vip-customers.component';
import { LoginAttemptsComponent } from './login-attempts/login-attempts.component';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { OrderManagementComponent } from './order-management/order-management.component';
import { OrderTrackingComponent } from './order-tracking/order-tracking.component';
import { ProductDetailComponent } from './admin/product-detail/product-detail.component';
import { UserProductDetailComponent } from './user-product-detail/user-product-detail.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReviewComponent } from './review/review.component';
import { BlacklistComponent } from './blacklist/blacklist.component';
import { DiscountInsertComponent } from './discount-insert/discount-insert.component';
import { DiscountEventManagementComponent } from './discount-management/discount-management.component';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DiscountCouponComponent } from './discount-coupon/discount-coupon.component';
import { DiscountPriceComponent } from './discount-price/discount-price.component';

@NgModule({
  declarations: [
    AppComponent,
    TestComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    HeaderComponent,
    UserProfileComponent,
    UserOrdersComponent,
    UserWishlistComponent,
    UserPaymentMethodsComponent,
    UserReviewsComponent,
    UserPersonalInfoComponent,
    UserAddressesComponent,
    UserNotificationsComponent,
    CreateBrandComponent,
    CreateCategoryComponent,
    LayoutComponent,
    SidebarComponent,
    NavbarComponent,
    CartPageComponent,
    CheckoutComponent,
    PaymentComponent,
    OrderConfirmComponent,
    ProductComponent,
    ProductMangementComponent,
    ProductDisplayComponent,
    WishlistComponent,
    CustomersComponent,
    CreateUserComponent,
    ActivityLogsComponent,
    AdminUsersComponent,
    RolesPermissionsComponent,
    VipCustomersComponent,
    LoginAttemptsComponent,
    UserProductDetailComponent,
    ReviewComponent,
    OrderManagementComponent,
    OrderTrackingComponent,
    DiscountInsertComponent,
    DiscountEventManagementComponent,
    DiscountCouponComponent,
    DiscountPriceComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule, // Required for ngModel/ngForm
    NgbModule,
    GoogleMapsModule,
    RouterModule,
    CommonModule, // Required for pipes like date, currency, number
    CartSidebarComponent, // Standalone component must be imported here
   ProductDetailComponent,
    BrowserAnimationsModule,
    BlacklistComponent,
    MatInputModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    AuthService,
    AddressService,
    RoleService,
    PermissionService,
    AuthService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
