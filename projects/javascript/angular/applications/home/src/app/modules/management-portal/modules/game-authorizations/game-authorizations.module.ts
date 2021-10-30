import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import {
  GameAuthorizationsFormPageComponent,
  GameAuthorizationsJsonPageComponent,
  GameAuthorizationsListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', component: GameAuthorizationsListPageComponent },
  { path: ':_id', component: GameAuthorizationsFormPageComponent },
  { path: ':_id/json', component: GameAuthorizationsJsonPageComponent },
];

@NgModule({
  declarations: [
    GameAuthorizationsFormPageComponent,
    GameAuthorizationsJsonPageComponent,
    GameAuthorizationsListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GameAuthorizationModule {}
