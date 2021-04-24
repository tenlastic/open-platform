import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { ArticleComponent, LayoutComponent, StatusComponent } from './components';
import {
  GameServersPageComponent,
  InformationPageComponent,
  NewsPageComponent,
  PatchNotesPageComponent,
  QueuesPageComponent,
} from './pages';

export const ROUTES: Routes = [
  {
    children: [
      {
        component: InformationPageComponent,
        path: '',
        pathMatch: 'full',
      },
      {
        component: InformationPageComponent,
        path: ':_id',
        pathMatch: 'full',
      },
      {
        component: GameServersPageComponent,
        path: ':_id/game-servers',
      },
      {
        component: NewsPageComponent,
        path: ':_id/news',
      },
      {
        component: PatchNotesPageComponent,
        path: ':_id/patch-notes',
      },
      {
        component: QueuesPageComponent,
        path: ':_id/queues',
      },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  declarations: [
    ArticleComponent,
    GameServersPageComponent,
    InformationPageComponent,
    LayoutComponent,
    NewsPageComponent,
    PatchNotesPageComponent,
    QueuesPageComponent,
    StatusComponent,
  ],
  entryComponents: [ArticleComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GamesModule {}
