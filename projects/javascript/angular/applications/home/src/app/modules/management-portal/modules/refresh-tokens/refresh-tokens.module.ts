import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { RefreshTokensListPageComponent } from './pages';

export const ROUTES: Routes = [{ path: '', component: RefreshTokensListPageComponent }];

const pages = [RefreshTokensListPageComponent];

@NgModule({
  declarations: [...pages],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class RefreshTokenModule {}
