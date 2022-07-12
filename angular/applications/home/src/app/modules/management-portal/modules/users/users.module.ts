import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { LayoutComponent } from './components';
import { UsersFormPageComponent, UsersJsonPageComponent, UsersListPageComponent } from './pages';

export const ROUTES: Routes = [
  { path: '', component: UsersListPageComponent },
  {
    path: ':userId',
    component: LayoutComponent,
    children: [
      { path: '', component: UsersFormPageComponent },
      {
        path: 'authorizations',
        loadChildren: () =>
          import('../authorizations/authorizations.module').then((m) => m.AuthorizationModule),
      },
      { path: 'json', component: UsersJsonPageComponent },
    ],
  },
];

@NgModule({
  declarations: [
    LayoutComponent,

    UsersFormPageComponent,
    UsersJsonPageComponent,
    UsersListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class UserModule {}
