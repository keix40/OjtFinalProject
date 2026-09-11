import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { JwtInterceptor } from './interceptors/jwt.interceptors.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserOrdersComponent } from './user-profile/user-orders/user-orders.component';
import { UserWishlistComponent } from './user-profile/user-wishlist/user-wishlist.component';
import { UserPaymentMethodsComponent } from './user-profile/user-payment-methods/user-payment-methods.component';
import { UserReviewsComponent } from './user-profile/user-reviews/user-reviews.component';
import { UserPersonalInfoComponent } from './user-profile/user-personal-info/user-personal-info.component';
import { UserAddressesComponent } from './user-profile/user-addresses/user-addresses.component';
import { UserNotificationsComponent } from './user-profile/user-notifications/user-notifications.component';
import { AddressService } from './services/address.service';
import { AuthService } from './auth/auth.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UserProductDetailComponent } from './user-product-detail/user-product-detail.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReviewComponent } from './review/review.component';
import { OrderTrackingComponent } from './order-tracking/order-tracking.component';
import { ReturnRequestComponent } from './return-request/return-request.component';
import { VerifyOtpComponent } from './auth/verify-otp/verify-otp.component';
import { NotificationComponent } from './notification/notification.component';
import { HeaderComponent } from './header/header.component';
import { BannedPageComponent } from './banned-page.component';
import { NotifcationService } from './notifcation.service';
import { ToastrModule } from 'ngx-toastr';
import { NotificationSidebarComponent } from './notification-sidebar/notification-sidebar.component';
import { LucideAngularModule, Tag, Box, Gift, Heart, ShoppingBag, Star } from 'lucide-angular';
import { UserCouponListComponent } from './user-profile/user-coupon-list/user-coupon-list.component';
import { HomeComponent } from './home/home.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { UserBrandListComponent } from './user-brand-list/user-brand-list.component';
import { UserPolicyComponent } from './user-policy/user-policy.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { BreadcrumbComponent } from './breadcrumb.component';
import { FooterComponent } from './footer/footer.component';
import { UserProductListComponent } from './user-product-list/user-product-list';
import { UserCategoryListComponent } from './user-category-list/user-category-list.component';
import { LuxUiModule } from './shared/ui/lux-ui.module';
import { SafeHtmlPipe } from './shared/safe-html.pipe';
import { MediaUrlPipe } from './shared/media-url.pipe';
import { BlacklistBlockedComponent } from './blacklist/blacklist-blocked.component';
import { IpBannedComponent } from './ip-banned/ip-banned.component';
import { GoogleMapsLoaderService } from './shared/google-maps-loader.service';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    UserOrdersComponent,
    UserWishlistComponent,
    UserPaymentMethodsComponent,
    UserReviewsComponent,
    UserPersonalInfoComponent,
    UserAddressesComponent,
    UserNotificationsComponent,
    UserProductDetailComponent,
    ReviewComponent,
    OrderTrackingComponent,
    ReturnRequestComponent,
    UserProfileComponent,
    UserCouponListComponent
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
    UserProductListComponent,
    HomeComponent,
    VerifyOtpComponent,
    NotificationComponent,
    BreadcrumbComponent,
    BannedPageComponent,
    NotificationSidebarComponent,
    HeaderComponent,
    AboutUsComponent,
    ContactUsComponent,
    FooterComponent,
    WishlistComponent,
    UserBrandListComponent,
    UserPolicyComponent,
    UserCategoryListComponent,
    BlacklistBlockedComponent,
    IpBannedComponent,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    LucideAngularModule.pick({ Tag, Box, Gift, Heart, ShoppingBag, Star }),
    LuxUiModule,
    SafeHtmlPipe,
    MediaUrlPipe,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    AuthService,
    AddressService,
    NotifcationService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(mapsLoader: GoogleMapsLoaderService) {
    mapsLoader.load();
  }
}
