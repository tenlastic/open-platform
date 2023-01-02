import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import {
  AuthorizationsFormPageComponent,
  AuthorizationsJsonPageComponent,
  AuthorizationsListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { component: AuthorizationsListPageComponent, path: '', title: 'Authorizations' },
  {
    component: AuthorizationsFormPageComponent,
    data: { param: 'authorizationId', title: 'Authorization' },
    path: ':authorizationId',
    title: FormResolver,
  },
  {
    component: AuthorizationsJsonPageComponent,
    data: { param: 'authorizationId', title: 'Authorization' },
    path: ':authorizationId/json',
    title: FormResolver,
  },
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
