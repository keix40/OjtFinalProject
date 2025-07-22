import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TestComponent } from './test/test.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { JwtInterceptor } from './interceptors/jwt.interceptors.service';

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
import { ProductComponent } from './product/product.component';
import { ProductMangementComponent } from './product-mangement/product-mangement.component';
import { AddressService } from './services/address.service';
import { AuthService } from './auth/auth.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CreateBrandComponent } from './create-brand/create-brand.component';
import { CreateCategoryComponent } from './create-category/create-category.component';
import { LayoutComponent } from './layout/layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
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
import { LoginAttemptsComponent } from './login-attempts/login-attempts.component';
import { UserProductDetailComponent } from './user-product-detail/user-product-detail.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReviewComponent } from './review/review.component';
import { BlacklistComponent } from './blacklist/blacklist.component';
import { DiscountInsertComponent } from './discount-insert/discount-insert.component';
import { DiscountEventManagementComponent } from './discount-management/discount-management.component';
import { DiscountCouponComponent } from './discount-coupon/discount-coupon.component';
import { FooterComponent } from './footer/footer.component';
import { OrderManagementComponent } from './order-management/order-management.component';
import { OrderTrackingComponent } from './order-tracking/order-tracking.component';
import { ReturnRequestComponent } from './return-request/return-request.component';
import { ReturnListComponent } from './return-list/return-list.component';
import { VerifyOtpComponent } from './auth/verify-otp/verify-otp.component';
import { CartSidebarComponent } from './cart-sidebar/cart-sidebar.component';
import { ProductDetailComponent } from './admin/product-detail/product-detail.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QuillModule } from 'ngx-quill';
import { NotificationComponent } from './notification/notification.component';
import { HeaderComponent } from './header/header.component';
import { BreadcrumbComponent } from './breadcrumb.component';

import { BrandListComponent } from './brand-list/brand-list.component';
import { UserBrandListComponent } from './user-brand-list/user-brand-list.component';
import { BannedPageComponent } from './banned-page.component';
import { NotifcationService } from './notifcation.service';
import { CreateDeliveryServiceComponent } from './create-delivery-service/create-delivery-service.component';
import { DeliveryServiceListComponent } from './delivery-service-list/delivery-service-list.component';
import { OrderInvoiceComponent } from './order-invoice/order-invoice.component';
import { ToastrModule } from 'ngx-toastr';
import { NotificationSidebarComponent } from './notification-sidebar/notification-sidebar.component';
import { AdminPolicyComponent } from './admin-policy/admin-policy.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DiscountAdminComponent } from './discount-admin/discount-admin.component';
import { UserPolicyComponent } from './user-policy/user-policy.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { ContactUsComponent } from './contact-us/contact-us.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    CreateDeliveryServiceComponent,
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
    LoginAttemptsComponent,
    UserProductDetailComponent,
    ReviewComponent,
    OrderManagementComponent,
    OrderTrackingComponent,
    DiscountInsertComponent,
    DiscountEventManagementComponent,
    DiscountCouponComponent,
    ReturnRequestComponent,
    ReturnListComponent,
    BrandListComponent,
    UserBrandListComponent,
    DeliveryServiceListComponent,
    OrderInvoiceComponent,

    CreateDeliveryServiceComponent,
    DeliveryServiceListComponent,
    OrderInvoiceComponent,
    AdminPolicyComponent,
    DashboardComponent,
    DiscountAdminComponent,
    UserPolicyComponent,
    AboutUsComponent,
    ContactUsComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    BrowserAnimationsModule,
    NgbModule,
    GoogleMapsModule,
    RouterModule,
    CartSidebarComponent,
    ProductDetailComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    QuillModule.forRoot(),
    BlacklistComponent,
    TestComponent,
    //MatInputModule,
    //MatAutocompleteModule,
    //MatFormFieldModule,
    // MatIconModule,
    //MatButtonModule,
    FooterComponent,
    HeaderComponent,
    BreadcrumbComponent,
    VerifyOtpComponent,
    NotificationComponent,
    BreadcrumbComponent,
    BannedPageComponent,
    NotificationSidebarComponent,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    AuthService,
    AddressService,
    NotifcationService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
