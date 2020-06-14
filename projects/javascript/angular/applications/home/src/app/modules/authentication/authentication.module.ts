import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import {
  LayoutComponent,
  LoginFormComponent,
  PasswordResetFormComponent,
  PasswordResetRequestFormComponent,
  RegistrationFormComponent,
} from './components';
import {
  CreateAccountPageComponent,
  LoginPageComponent,
  LogoutPageComponent,
  RequestPasswordResetPageComponent,
  ResetPasswordPageComponent,
} from './pages';

export const ROUTES: Routes = [
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
        component: RequestPasswordResetPageComponent,
      },
      {
        path: 'reset-password/:hash',
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
    LoginFormComponent,
    LoginPageComponent,
    LogoutPageComponent,
    PasswordResetFormComponent,
    PasswordResetRequestFormComponent,
    RegistrationFormComponent,
    RequestPasswordResetPageComponent,
    ResetPasswordPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class AuthenticationModule {}
