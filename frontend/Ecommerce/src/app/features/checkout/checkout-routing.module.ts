import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../auth/guards/auth.guard.service';
import { BlacklistGuard } from '../../guards/blacklist.guard';
import { CheckoutComponent } from '../../checkout/checkout.component';
import { PaymentComponent } from '../../payment/payment.component';
import { OrderConfirmComponent } from '../../order-confirm/order-confirm.component';

const routes: Routes = [
  { path: '', component: CheckoutComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Checkout' } },
  { path: 'payment', component: PaymentComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Payment' } },
  { path: 'confirm', component: OrderConfirmComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Order Confirmation' } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CheckoutRoutingModule {}
