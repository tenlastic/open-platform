import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import {
  GameServerTemplatesFormPageComponent,
  GameServerTemplatesJsonPageComponent,
  GameServerTemplatesListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { component: GameServerTemplatesListPageComponent, path: '', title: 'Game Server Templates' },
  {
    component: GameServerTemplatesFormPageComponent,
    data: { param: 'gameServerTemplateId', title: 'Game Server Template' },
    path: ':gameServerTemplateId',
    title: FormResolver,
  },
  {
    component: GameServerTemplatesJsonPageComponent,
    data: { param: 'gameServerTemplateId', title: 'Game Server Template' },
    path: ':gameServerTemplateId/json',
    title: FormResolver,
  },
];

const pages = [
  GameServerTemplatesFormPageComponent,
  GameServerTemplatesJsonPageComponent,
  GameServerTemplatesListPageComponent,
];

@NgModule({
  declarations: [...pages],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GameServerTemplateModule {}
