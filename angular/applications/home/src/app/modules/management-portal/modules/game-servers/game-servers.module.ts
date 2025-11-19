import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FormResolver } from '@home/app/core/resolvers';
import { SharedModule } from '@home/app/shared/shared.module';
import { LogsOverlayComponent } from './components';
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

const components = [LogsOverlayComponent];
const pages = [
  GameServersFormPageComponent,
  GameServersJsonPageComponent,
  GameServersListPageComponent,
];

@NgModule({
  declarations: [...components, ...pages],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GameServerModule {}
