import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { UsersFormPageComponent } from './pages/form/form-page.component';
import { UsersListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: UsersListPageComponent },
  { path: ':_id', component: UsersFormPageComponent },
];

@NgModule({
  declarations: [UsersFormPageComponent, UsersListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class UserModule {}
