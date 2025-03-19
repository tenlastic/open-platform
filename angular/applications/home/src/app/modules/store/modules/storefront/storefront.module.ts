import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IArticle } from '@tenlastic/http';

import { SharedModule } from '../../../../shared/shared.module';
import { DownloadComponent, LayoutComponent, SocialComponent, StatusComponent } from './components';
import { StatusGuard } from './guards';
import { GameServersPageComponent, QueuesPageComponent, StorefrontPageComponent } from './pages';

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
        data: { type: IArticle.Type.Guide },
        loadChildren: () => import('../articles/articles.module').then((m) => m.ArticlesModule),
        path: 'guides',
        title: 'Guides',
      },
      {
        data: { type: IArticle.Type.News },
        loadChildren: () => import('../articles/articles.module').then((m) => m.ArticlesModule),
        path: 'news',
        title: 'News',
      },
      {
        data: { type: IArticle.Type.PatchNotes },
        loadChildren: () => import('../articles/articles.module').then((m) => m.ArticlesModule),
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
    DownloadComponent,
    LayoutComponent,
    SocialComponent,
    StatusComponent,

    GameServersPageComponent,
    QueuesPageComponent,
    StorefrontPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class StorefrontModule {}
