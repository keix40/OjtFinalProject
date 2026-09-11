import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartRoutingModule } from './cart-routing.module';
import { CartPageComponent } from '../../cart-page/cart-page.component';
import { LuxUiModule } from '../../shared/ui/lux-ui.module';
import { CartSidebarComponent } from '../../cart-sidebar/cart-sidebar.component';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';

@NgModule({
  declarations: [CartPageComponent],
  imports: [CommonModule, FormsModule, CartRoutingModule, LuxUiModule, CartSidebarComponent, HeaderComponent, FooterComponent]
})
export class CartModule {}
