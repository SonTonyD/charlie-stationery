import { Routes } from '@angular/router';
import { CustomBoxBuilderComponent } from './custom-box-builder.component';
import { HomeComponent } from './home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'personnaliser-box', component: CustomBoxBuilderComponent },
  { path: '**', redirectTo: '' },
];
