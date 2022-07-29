import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { ArticleComponent, LayoutComponent, StatusComponent } from './components';
import { StatusGuard, StorefrontGuard } from './guards';
import {
  GameServersPageComponent,
  GuidesPageComponent,
  InformationPageComponent,
  NewsPageComponent,
  PatchNotesPageComponent,
  QueuesPageComponent,
  StorefrontsPageComponent,
} from './pages';

export const ROUTES: Routes = [
  {
    children: [
      {
        component: StorefrontsPageComponent,
        path: '',
        pathMatch: 'full',
      },
      {
        canActivate: [StorefrontGuard],
        component: InformationPageComponent,
        path: ':_id',
        pathMatch: 'full',
      },
      {
        canActivate: [StorefrontGuard, StatusGuard],
        component: GameServersPageComponent,
        path: ':_id/game-servers',
      },
      {
        canActivate: [StorefrontGuard],
        component: GuidesPageComponent,
        path: ':_id/guides',
      },
      {
        canActivate: [StorefrontGuard],
        component: NewsPageComponent,
        path: ':_id/news',
      },
      {
        canActivate: [StorefrontGuard],
        component: PatchNotesPageComponent,
        path: ':_id/patch-notes',
      },
      {
        canActivate: [StorefrontGuard, StatusGuard],
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
    GuidesPageComponent,
    InformationPageComponent,
    LayoutComponent,
    NewsPageComponent,
    PatchNotesPageComponent,
    QueuesPageComponent,
    StatusComponent,
    StorefrontsPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class StoreModule {}
