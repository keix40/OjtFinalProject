import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QuillModule } from 'ngx-quill';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LucideAngularModule, Tag, Box, Gift, Heart, ShoppingBag, Star } from 'lucide-angular';
import { AdminRoutingModule } from './admin-routing.module';
import { LuxUiModule } from '../../shared/ui/lux-ui.module';
import { SafeHtmlPipe } from '../../shared/safe-html.pipe';
import { MediaUrlPipe } from '../../shared/media-url.pipe';
import { LayoutComponent } from '../../layout/layout.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { DashboardComponent } from '../../dashboard/dashboard.component';
import { ProductComponent } from '../../product/product.component';
import { ProductMangementComponent } from '../../product-mangement/product-mangement.component';
import { BrandListComponent } from '../../brand-list/brand-list.component';
import { OrderManagementComponent } from '../../order-management/order-management.component';
import { ReturnListComponent } from '../../return-list/return-list.component';
import { DiscountInsertComponent } from '../../discount-insert/discount-insert.component';
import { DiscountEventManagementComponent } from '../../discount-management/discount-management.component';
import { DiscountCouponComponent } from '../../discount-coupon/discount-coupon.component';
import { CreateDeliveryServiceComponent } from '../../create-delivery-service/create-delivery-service.component';
import { DeliveryServiceListComponent } from '../../delivery-service-list/delivery-service-list.component';
import { CustomersComponent } from '../../customers/customers.component';
import { CreateUserComponent } from '../../create-user/create-user.component';
import { ActivityLogsComponent } from '../../activity-logs/activity-logs.component';
import { AdminUsersComponent } from '../../admin-users/admin-users.component';
import { RolesPermissionsComponent } from '../../roles-permissions/roles-permissions.component';
import { LoginAttemptsComponent } from '../../login-attempts/login-attempts.component';
import { AdminPolicyComponent } from '../../admin-policy/admin-policy.component';
import { AdminPolicyEditComponent } from '../../admin-policy/admin-policy-edit.component';
import { AdminProfileComponent } from '../../admin-profile/admin-profile.component';
import { CreateBrandComponent } from '../../create-brand/create-brand.component';
import { CreateCategoryComponent } from '../../create-category/create-category.component';
import { ProductDisplayComponent } from '../../product-display/product-display.component';
import { DiscountAdminComponent } from '../../discount-admin/discount-admin.component';
import { AdminInboxComponent } from '../../admin-inbox/admin-inbox.component';
import { OrderInvoiceComponent } from '../../order-invoice/order-invoice.component';
import { ConfirmModelComponent } from '../../confirm-model/confirm-model.component';
import { ProductDetailComponent } from '../../admin/product-detail/product-detail.component';
import { CategoryListComponent } from '../../category-list/category-list.component';
import { CategoryUpdateComponent } from '../../category-update/category-update.component';
import { CategoryAddSubcategoryComponent } from '../../category-add-subcategory/category-add-subcategory.component';
import { BrandUpdateComponent } from '../../brand-update/brand-update.component';
import { CreateAttributeValueComponent } from '../../create-attribute-value/create-attribute-value.component';
import { ReturnDetailComponent } from '../../return-detail/return-detail.component';
import { RevenueTargetAdminComponent } from '../../revenue-target-admin/revenue-target-admin.component';
import { VipTiersAdminComponent } from '../../vip-customers/vip-tiers-admin.component';
import { BlacklistComponent } from '../../blacklist/blacklist.component';
import { CreateEventComponent } from '../../create-event/create-event.component';
import { EventListComponent } from '../../event-list/event-list.component';
import { VipCustomersComponent } from '../../vip-customers/vip-customers.component';
import { BreadcrumbComponent } from '../../breadcrumb.component';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';

@NgModule({
  declarations: [
    LayoutComponent,
    SidebarComponent,
    NavbarComponent,
    DashboardComponent,
    ProductComponent,
    ProductMangementComponent,
    BrandListComponent,
    OrderManagementComponent,
    ReturnListComponent,
    DiscountInsertComponent,
    DiscountEventManagementComponent,
    DiscountCouponComponent,
    CreateDeliveryServiceComponent,
    DeliveryServiceListComponent,
    CustomersComponent,
    CreateUserComponent,
    ActivityLogsComponent,
    AdminUsersComponent,
    RolesPermissionsComponent,
    LoginAttemptsComponent,
    AdminPolicyComponent,
    AdminPolicyEditComponent,
    AdminProfileComponent,
    CreateBrandComponent,
    CreateCategoryComponent,
    ProductDisplayComponent,
    DiscountAdminComponent,
    AdminInboxComponent,
    OrderInvoiceComponent,
    ConfirmModelComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    NgbModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    QuillModule,
    LuxUiModule,
    SafeHtmlPipe,
    MediaUrlPipe,
    ProductDetailComponent,
    CategoryListComponent,
    CategoryUpdateComponent,
    CategoryAddSubcategoryComponent,
    BrandUpdateComponent,
    CreateAttributeValueComponent,
    ReturnDetailComponent,
    RevenueTargetAdminComponent,
    VipTiersAdminComponent,
    BlacklistComponent,
    CreateEventComponent,
    EventListComponent,
    VipCustomersComponent,
    BreadcrumbComponent,
    HeaderComponent,
    FooterComponent,
    LucideAngularModule.pick({ Tag, Box, Gift, Heart, ShoppingBag, Star })
  ]
})
export class AdminModule {}
