import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NamespaceGuard } from '../../core/guards';
import { SharedModule } from '../../shared/shared.module';
import { LayoutComponent } from './components';

export const ROUTES: Routes = [
  {
    canActivate: [NamespaceGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'namespaces' },
      {
        path: 'articles',
        loadChildren: () =>
          import('./modules/articles/articles.module').then((m) => m.ArticleModule),
      },
      {
        path: 'builds',
        loadChildren: () => import('./modules/builds/builds.module').then((m) => m.BuildModule),
      },
      {
        path: 'databases',
        loadChildren: () =>
          import('./modules/databases/databases.module').then((m) => m.DatabaseModule),
      },
      {
        path: 'game-authorizations',
        loadChildren: () =>
          import('./modules/game-authorizations/game-authorizations.module').then(
            (m) => m.GameAuthorizationModule,
          ),
      },
      {
        path: 'game-servers',
        loadChildren: () =>
          import('./modules/game-servers/game-servers.module').then((m) => m.GameServerModule),
      },
      {
        path: 'games',
        loadChildren: () => import('./modules/games/games.module').then((m) => m.GameModule),
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
