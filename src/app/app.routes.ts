import { Routes } from '@angular/router';
import { adminAuthGuard } from './admin/admin-auth.guard';
import { AdminLoginComponent } from './admin/admin-login.component';
import { AdminComponent } from './admin/admin.component';
import { BoxDetailComponent } from './box-detail.component';
import { CartComponent } from './cart.component';
import { CheckoutCancelComponent } from './checkout-cancel.component';
import { CheckoutSuccessComponent } from './checkout-success.component';
import { CustomBoxBuilderComponent } from './custom-box-builder.component';
import { HomeComponent } from './home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'box/:id', component: BoxDetailComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [adminAuthGuard] },
  { path: 'panier', component: CartComponent },
  { path: 'personnaliser-box', component: CustomBoxBuilderComponent },
  { path: 'checkout/success', component: CheckoutSuccessComponent },
  { path: 'checkout/cancel', component: CheckoutCancelComponent },
  { path: '**', redirectTo: '' },
];
