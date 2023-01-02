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
        component: CreateAccountPageComponent,
        path: 'create-account',
        title: 'Create Account',
      },
      {
        component: LoginPageComponent,
        path: 'log-in',
        title: 'Log In',
      },
      {
        component: LogoutPageComponent,
        path: 'log-out',
        title: 'Log Out',
      },
      {
        component: RequestPasswordResetPageComponent,
        path: 'reset-password',
        title: 'Reset Password',
      },
      {
        component: ResetPasswordPageComponent,
        path: 'reset-password/:hash',
        title: 'Reset Password',
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
