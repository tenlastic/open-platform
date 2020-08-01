import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { GameServersFormPageComponent } from './pages/form/form-page.component';
import { GameServersListPageComponent } from './pages/list/list-page.component';
import { GameServersLogsPageComponent } from './pages/logs/logs-page.component';

export const ROUTES: Routes = [
  { path: '', component: GameServersListPageComponent },
  { path: ':_id', component: GameServersFormPageComponent },
  { path: ':_id/logs', component: GameServersLogsPageComponent },
];

const pages = [
  GameServersFormPageComponent,
  GameServersListPageComponent,
  GameServersLogsPageComponent,
];

@NgModule({
  declarations: [...pages],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GameServerModule {}
