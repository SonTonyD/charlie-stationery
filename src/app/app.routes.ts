import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { CustomBoxBuilderComponent } from './custom-box-builder.component';
import { HomeComponent } from './home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'personnaliser-box', component: CustomBoxBuilderComponent },
  { path: '**', redirectTo: '' },
];
