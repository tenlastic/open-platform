import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { GameAuthorizationsFormPageComponent } from './pages/form/form-page.component';
import { GameAuthorizationsListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: GameAuthorizationsListPageComponent },
  { path: ':_id', component: GameAuthorizationsFormPageComponent },
];

@NgModule({
  declarations: [GameAuthorizationsFormPageComponent, GameAuthorizationsListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GameAuthorizationModule {}
