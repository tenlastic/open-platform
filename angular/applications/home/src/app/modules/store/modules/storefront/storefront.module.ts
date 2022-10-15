import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import {
  ArticleComponent,
  DownloadComponent,
  LayoutComponent,
  StatusComponent,
} from './components';
import { StatusGuard } from './guards';
import {
  GameServersPageComponent,
  GuidesPageComponent,
  NewsPageComponent,
  PatchNotesPageComponent,
  QueuesPageComponent,
  StorefrontPageComponent,
} from './pages';

export const ROUTES: Routes = [
  {
    children: [
      {
        component: StorefrontPageComponent,
        path: '',
        pathMatch: 'full',
        title: 'Storefront',
      },
      {
        canActivate: [StatusGuard],
        component: GameServersPageComponent,
        path: 'game-servers',
        title: 'Game Servers',
      },
      {
        component: GuidesPageComponent,
        path: 'guides',
        title: 'Guides',
      },
      {
        component: NewsPageComponent,
        path: 'news',
        title: 'News',
      },
      {
        component: PatchNotesPageComponent,
        path: 'patch-notes',
        title: 'Patch Notes',
      },
      {
        canActivate: [StatusGuard],
        component: QueuesPageComponent,
        path: 'queues',
        title: 'Queues',
      },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  declarations: [
    ArticleComponent,
    DownloadComponent,
    LayoutComponent,
    StatusComponent,

    GameServersPageComponent,
    GuidesPageComponent,
    NewsPageComponent,
    PatchNotesPageComponent,
    QueuesPageComponent,
    StorefrontPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class StorefrontModule {}
