import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { ArticleComponent, LayoutComponent, StatusComponent } from './components';
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
      },
      {
        canActivate: [StatusGuard],
        component: GameServersPageComponent,
        path: 'game-servers',
      },
      {
        component: GuidesPageComponent,
        path: 'guides',
      },
      {
        component: NewsPageComponent,
        path: 'news',
      },
      {
        component: PatchNotesPageComponent,
        path: 'patch-notes',
      },
      {
        canActivate: [StatusGuard],
        component: QueuesPageComponent,
        path: 'queues',
      },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  declarations: [
    ArticleComponent,
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
