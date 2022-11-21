import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import {
  AuthorizationRequestsFormPageComponent,
  AuthorizationRequestsListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { component: AuthorizationRequestsListPageComponent, path: '', title: 'AuthorizationRequests' },
  {
    component: AuthorizationRequestsFormPageComponent,
    data: { param: 'authorizationRequestId', title: 'AuthorizationRequest' },
    path: ':authorizationRequestId',
    title: FormResolver,
  },
];

@NgModule({
  declarations: [AuthorizationRequestsFormPageComponent, AuthorizationRequestsListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class AuthorizationRequestModule {}
