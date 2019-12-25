import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';

import {
  LoginFormComponent,
  PasswordResetFormComponent,
  PasswordResetRequestFormComponent,
  RegistrationFormComponent,
} from './components';
import { LoginPageComponent } from './pages/login-page.component';

export const ROUTES: Routes = [{ path: '', component: LoginPageComponent }];

@NgModule({
  declarations: [
    LoginFormComponent,
    PasswordResetFormComponent,
    PasswordResetRequestFormComponent,
    RegistrationFormComponent,

    LoginPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class LoginModule {}
