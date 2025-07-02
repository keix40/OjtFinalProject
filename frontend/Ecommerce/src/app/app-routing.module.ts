import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
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

const routes: Routes = [
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile/:userId', component: UserProfileComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'product', component: ProductComponent },
      { path: 'productlist', component: ProductMangementComponent },
      { path: 'admin/products/:id', component: ProductDetailComponent },
      { path: 'orders', component: OrderManagementComponent },
      // add more routes here
    ],},
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'cart', component: CartPageComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'checkout/payment', component: PaymentComponent },
  { path: 'checkout/confirm', component: OrderConfirmComponent },
  { path: 'display', component: ProductDisplayComponent },
  { path: 'wishlist', component: WishlistComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'product', component: ProductComponent },
      { path: 'productlist', component: ProductMangementComponent },
      { path: 'admin/products/:id', component: ProductDetailComponent },
      { path: 'users/customers', component: CustomersComponent },
      { path: 'users/create', component: CreateUserComponent ,canActivate: [AuthGuard],
        data: { permission: 'Users Create' }},
      { path: 'users/activity', component: ActivityLogsComponent},
      { path: 'users/admins', component: AdminUsersComponent},
      { path: 'users/roles', component: RolesPermissionsComponent},
      { path: 'users/vip', component: VipCustomersComponent},
      { path: 'users/blacklist', component: BlacklistComponent},
      { path: 'users/login-attempts', component: LoginAttemptsComponent},
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
  { path: 'ordertracking/:orderId', component: OrderTrackingComponent },
  { path: 'user-product-detail/:id', component: UserProductDetailComponent },
  { path: 'product/:id', component: UserProductDetailComponent },
  { path: 'review', component: ReviewComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
