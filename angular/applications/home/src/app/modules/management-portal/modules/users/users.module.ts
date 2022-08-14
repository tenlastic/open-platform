import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import { UsersFormPageComponent, UsersJsonPageComponent, UsersListPageComponent } from './pages';

export const ROUTES: Routes = [
  { component: UsersListPageComponent, path: '', title: 'Users' },
  {
    children: [
      {
        component: UsersFormPageComponent,
        data: { param: 'userId', title: 'User' },
        path: '',
        title: FormResolver,
      },
      {
        component: UsersJsonPageComponent,
        data: { param: 'userId', title: 'User' },
        path: 'json',
        title: FormResolver,
      },
    ],
    path: ':userId',
  },
];

@NgModule({
  declarations: [UsersFormPageComponent, UsersJsonPageComponent, UsersListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class UserModule {}
