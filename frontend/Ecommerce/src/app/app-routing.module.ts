import { NgModule } from '@angular/core';
import { RouterModule, Routes, CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthGuard } from './auth/guards/auth.guard.service';
import { BlacklistGuard } from './guards/blacklist.guard';
import { IpService } from './services/ip.service';
import { LoginAttemptsService } from './services/login-attempts.service';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { VerifyOtpComponent } from './auth/verify-otp/verify-otp.component';
import { LoggedInGuard } from './auth/guards/logged-in.guard';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserProductDetailComponent } from './user-product-detail/user-product-detail.component';
import { UserProductListComponent } from './user-product-list/user-product-list';
import { UserCategoryListComponent } from './user-category-list/user-category-list.component';
import { UserBrandListComponent } from './user-brand-list/user-brand-list.component';
import { UserPolicyComponent } from './user-policy/user-policy.component';
import { OrderTrackingComponent } from './order-tracking/order-tracking.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { ReviewComponent } from './review/review.component';
import { ReturnRequestComponent } from './return-request/return-request.component';
import { HomeComponent } from './home/home.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { BlacklistBlockedComponent } from './blacklist/blacklist-blocked.component';
import { IpBannedComponent } from './ip-banned/ip-banned.component';
import { BannedPageComponent } from './banned-page.component';

@Injectable({ providedIn: 'root' })
export class BlockedGuard implements CanActivate {
  constructor(private ipService: IpService, private loginAttemptsService: LoginAttemptsService, private router: Router) {}
  canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
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

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [LoggedInGuard], data: { role: 'customer' } },
  { path: 'register', component: RegisterComponent, canActivate: [LoggedInGuard], data: { breadcrumb: 'Register', role: 'customer' } },
  { path: 'verify-otp', component: VerifyOtpComponent, data: { role: 'customer' } },
  { path: 'blacklist-blocked', component: BlacklistBlockedComponent, data: { role: 'customer' } },
  { path: 'ip-banned', component: IpBannedComponent, data: { role: 'customer' } },
  { path: 'banned', component: BannedPageComponent, data: { role: 'customer' } },

  // Public storefront (catalog browsing without login)
  { path: 'home', component: HomeComponent, canActivate: [BlacklistGuard] },
  { path: 'about-us', component: AboutUsComponent, data: { breadcrumb: 'About Us', role: 'customer' } },
  { path: 'contact-us', component: ContactUsComponent, data: { breadcrumb: 'Contact Us', role: 'customer' } },
  { path: 'user/policies', component: UserPolicyComponent, data: { breadcrumb: 'User Policies', role: 'customer' } },
  { path: 'userproductlist', component: UserProductListComponent, canActivate: [BlacklistGuard], data: { breadcrumb: 'ProductList' } },
  { path: 'product/:id', component: UserProductDetailComponent, canActivate: [BlacklistGuard], data: { breadcrumb: 'Product Detail' } },
  { path: 'usercategorylist', component: UserCategoryListComponent, canActivate: [BlacklistGuard] },
  { path: 'userbrandlist', component: UserBrandListComponent, canActivate: [BlacklistGuard] },
  { path: 'display', redirectTo: 'userproductlist', pathMatch: 'full' },

  // Lazy-loaded checkout flow
  { path: 'cart', loadChildren: () => import('./features/checkout/cart.module').then(m => m.CartModule) },
  { path: 'checkout', loadChildren: () => import('./features/checkout/checkout.module').then(m => m.CheckoutModule) },

  // Authenticated customer routes
  { path: 'wishlist', component: WishlistComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Wishlist' } },
  { path: 'review', component: ReviewComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Review', role: 'customer' } },
  { path: 'return-request', component: ReturnRequestComponent, canActivate: [AuthGuard, BlacklistGuard] },
  { path: 'ordertracking/:orderId', component: OrderTrackingComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Order Tracking', role: 'customer' } },
  { path: 'profile/:userId', component: UserProfileComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Profile' } },

  // Lazy-loaded admin shell (dashboard, customers, products, etc.)
  { path: '', loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) }
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
export class AppRoutingModule {}
