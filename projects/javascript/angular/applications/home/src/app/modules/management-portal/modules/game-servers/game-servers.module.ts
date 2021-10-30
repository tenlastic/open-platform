import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import {
  GameServersFormPageComponent,
  GameServersJsonPageComponent,
  GameServersListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', component: GameServersListPageComponent },
  { path: ':_id', component: GameServersFormPageComponent },
  { path: ':_id/json', component: GameServersJsonPageComponent },
];

const pages = [
  GameServersFormPageComponent,
  GameServersJsonPageComponent,
  GameServersListPageComponent,
];

@NgModule({
  declarations: [...pages],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GameServerModule {}
