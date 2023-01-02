import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import {
  GameServersFormPageComponent,
  GameServersJsonPageComponent,
  GameServersListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { component: GameServersListPageComponent, path: '', title: 'Game Servers' },
  {
    component: GameServersFormPageComponent,
    data: { param: 'gameServerId', title: 'Game Server' },
    path: ':gameServerId',
    title: FormResolver,
  },
  {
    component: GameServersJsonPageComponent,
    data: { param: 'gameServerId', title: 'Game Server' },
    path: ':gameServerId/json',
    title: FormResolver,
  },
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
