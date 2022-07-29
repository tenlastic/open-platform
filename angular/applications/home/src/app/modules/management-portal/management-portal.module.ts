import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { LayoutComponent } from './components';

export const ROUTES: Routes = [
  {
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'namespaces' },
      {
        path: 'articles',
        loadChildren: () =>
          import('./modules/articles/articles.module').then((m) => m.ArticleModule),
      },
      {
        path: 'authorizations',
        loadChildren: () =>
          import('./modules/authorizations/authorizations.module').then(
            (m) => m.AuthorizationModule,
          ),
      },
      {
        path: 'builds',
        loadChildren: () => import('./modules/builds/builds.module').then((m) => m.BuildModule),
      },
      {
        path: 'collections',
        loadChildren: () =>
          import('./modules/collections/collections.module').then((m) => m.CollectionModule),
      },
      {
        path: 'game-servers',
        loadChildren: () =>
          import('./modules/game-servers/game-servers.module').then((m) => m.GameServerModule),
      },
      {
        path: 'namespaces',
        loadChildren: () =>
          import('./modules/namespaces/namespaces.module').then((m) => m.NamespaceModule),
      },
      {
        path: 'queues',
        loadChildren: () => import('./modules/queues/queues.module').then((m) => m.QueueModule),
      },
      {
        path: 'refresh-tokens',
        loadChildren: () =>
          import('./modules/refresh-tokens/refresh-tokens.module').then(
            (m) => m.RefreshTokenModule,
          ),
      },
      {
        path: 'storefronts',
        loadChildren: () =>
          import('./modules/storefronts/storefronts.module').then((m) => m.StorefrontModule),
      },
      {
        path: 'users',
        loadChildren: () => import('./modules/users/users.module').then((m) => m.UserModule),
      },
      {
        path: 'web-sockets',
        loadChildren: () =>
          import('./modules/web-sockets/web-sockets.module').then((m) => m.WebSocketModule),
      },
      {
        path: 'workflows',
        loadChildren: () =>
          import('./modules/workflows/workflows.module').then((m) => m.WorkflowsModule),
      },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  declarations: [LayoutComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class ManagementPortalModule {}
