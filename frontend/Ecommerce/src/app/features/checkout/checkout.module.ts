import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CheckoutRoutingModule } from './checkout-routing.module';
import { CheckoutComponent } from '../../checkout/checkout.component';
import { PaymentComponent } from '../../payment/payment.component';
import { OrderConfirmComponent } from '../../order-confirm/order-confirm.component';
import { LuxUiModule } from '../../shared/ui/lux-ui.module';
import { GoogleMapsModule } from '@angular/google-maps';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';

@NgModule({
  declarations: [CheckoutComponent, PaymentComponent, OrderConfirmComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CheckoutRoutingModule, LuxUiModule, GoogleMapsModule, HeaderComponent, FooterComponent]
})
export class CheckoutModule {}
