import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import {
  AuthorizationsFormPageComponent,
  AuthorizationsJsonPageComponent,
  AuthorizationsListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', component: AuthorizationsListPageComponent },
  { path: ':authorizationId', component: AuthorizationsFormPageComponent },
  { path: ':authorizationId/json', component: AuthorizationsJsonPageComponent },
];

@NgModule({
  declarations: [
    AuthorizationsFormPageComponent,
    AuthorizationsJsonPageComponent,
    AuthorizationsListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class AuthorizationModule {}
