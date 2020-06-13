import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { RefreshTokensFormPageComponent, RefreshTokensListPageComponent } from './pages';

export const ROUTES: Routes = [
  { path: '', component: RefreshTokensListPageComponent },
  { path: ':jti', component: RefreshTokensFormPageComponent },
];

const pages = [RefreshTokensFormPageComponent, RefreshTokensListPageComponent];

@NgModule({
  declarations: [...pages],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class RefreshTokenModule {}
