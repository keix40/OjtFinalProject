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
    CartSidebarComponent // Standalone component must be imported here
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    AuthService,
    AddressService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
