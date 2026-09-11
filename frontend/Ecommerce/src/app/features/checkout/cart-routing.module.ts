import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../auth/guards/auth.guard.service';
import { BlacklistGuard } from '../../guards/blacklist.guard';
import { CartPageComponent } from '../../cart-page/cart-page.component';

const routes: Routes = [
  { path: '', component: CartPageComponent, canActivate: [AuthGuard, BlacklistGuard], data: { breadcrumb: 'Shopping Cart' } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CartRoutingModule {}
