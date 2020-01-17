import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ComponentLibraryModule } from '@tenlastic/ng-component-library';

import { SharedModule } from '../../shared/shared.module';
import { LoginPageComponent } from './pages/login-page.component';

export const ROUTES: Routes = [{ path: '', component: LoginPageComponent }];

@NgModule({
  declarations: [LoginPageComponent],
  imports: [ComponentLibraryModule, SharedModule, RouterModule.forChild(ROUTES)],
})
export class LoginModule {}
