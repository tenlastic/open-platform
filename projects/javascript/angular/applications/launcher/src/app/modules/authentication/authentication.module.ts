import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { LayoutComponent } from './components';
import {
  CreateAccountPageComponent,
  LoginPageComponent,
  LogoutPageComponent,
  ResetPasswordPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'log-in' },
  {
    children: [
      {
        path: 'create-account',
        component: CreateAccountPageComponent,
      },
      {
        path: 'log-in',
        component: LoginPageComponent,
      },
      {
        path: 'log-out',
        component: LogoutPageComponent,
      },
      {
        path: 'reset-password',
        component: ResetPasswordPageComponent,
      },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  declarations: [
    CreateAccountPageComponent,
    LayoutComponent,
    LoginPageComponent,
    LogoutPageComponent,
    ResetPasswordPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class AuthenticationModule {}
