import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { ArticleComponent, LayoutComponent, StatusComponent } from './components';
import { GameGuard, StatusGuard } from './guards';
import {
  GameServersPageComponent,
  GamesListPageComponent,
  GuidesPageComponent,
  InformationPageComponent,
  NewsPageComponent,
  PatchNotesPageComponent,
  QueuesPageComponent,
} from './pages';

export const ROUTES: Routes = [
  {
    children: [
      {
        component: GamesListPageComponent,
        path: '',
        pathMatch: 'full',
      },
      {
        canActivate: [GameGuard],
        component: InformationPageComponent,
        path: ':_id',
        pathMatch: 'full',
      },
      {
        canActivate: [GameGuard, StatusGuard],
        component: GameServersPageComponent,
        path: ':_id/game-servers',
      },
      {
        canActivate: [GameGuard],
        component: GuidesPageComponent,
        path: ':_id/guides',
      },
      {
        canActivate: [GameGuard],
        component: NewsPageComponent,
        path: ':_id/news',
      },
      {
        canActivate: [GameGuard],
        component: PatchNotesPageComponent,
        path: ':_id/patch-notes',
      },
      {
        canActivate: [GameGuard, StatusGuard],
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
    GamesListPageComponent,
    GuidesPageComponent,
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
