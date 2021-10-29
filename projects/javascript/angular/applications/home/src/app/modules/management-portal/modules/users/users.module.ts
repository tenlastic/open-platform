import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { UsersFormPageComponent, UsersJsonPageComponent, UsersListPageComponent } from './pages';

export const ROUTES: Routes = [
  { path: '', component: UsersListPageComponent },
  { path: ':_id', component: UsersFormPageComponent },
  { path: ':_id/json', component: UsersJsonPageComponent },
];

@NgModule({
  declarations: [UsersFormPageComponent, UsersJsonPageComponent, UsersListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class UserModule {}
