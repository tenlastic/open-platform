import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import { LayoutComponent } from './components';
import {
  NamespacesFormPageComponent,
  NamespacesJsonPageComponent,
  NamespacesListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { component: NamespacesListPageComponent, path: '', title: 'Namespaces' },
  {
    children: [
      {
        component: NamespacesFormPageComponent,
        data: { param: 'namespaceId', title: 'Namespace' },
        path: '',
        title: FormResolver,
      },
      {
        loadChildren: () => import('../articles/articles.module').then((m) => m.ArticleModule),
        path: 'articles',
      },
      {
        loadChildren: () =>
          import('../authorizations/authorizations.module').then((m) => m.AuthorizationModule),
        path: 'authorizations',
      },
      {
        loadChildren: () =>
          import('../authorization-requests/authorization-requests.module').then(
            (m) => m.AuthorizationRequestModule,
          ),
        path: 'authorization-requests',
      },
      {
        loadChildren: () => import('../builds/builds.module').then((m) => m.BuildModule),
        path: 'builds',
      },
      {
        loadChildren: () =>
          import('../collections/collections.module').then((m) => m.CollectionModule),
        path: 'collections',
      },
      {
        loadChildren: () =>
          import('../game-servers/game-servers.module').then((m) => m.GameServerModule),
        path: 'game-servers',
      },
      {
        component: NamespacesJsonPageComponent,
        data: { param: 'namespaceId', title: 'Namespace' },
        path: 'json',
        title: FormResolver,
      },
      {
        loadChildren: () => import('../matches/matches.module').then((m) => m.MatchModule),
        path: 'matches',
      },
      {
        loadChildren: () => import('../queues/queues.module').then((m) => m.QueueModule),
        path: 'queues',
      },
      {
        loadChildren: () =>
          import('../storefronts/storefronts.module').then((m) => m.StorefrontModule),
        path: 'storefront',
      },
      {
        loadChildren: () =>
          import('../authorizations/authorizations.module').then((m) => m.AuthorizationModule),
        path: 'users',
      },
      {
        loadChildren: () =>
          import('../web-sockets/web-sockets.module').then((m) => m.WebSocketModule),
        path: 'web-sockets',
      },
      {
        loadChildren: () => import('../workflows/workflows.module').then((m) => m.WorkflowsModule),
        path: 'workflows',
      },
    ],
    component: LayoutComponent,
    path: ':namespaceId',
  },
];

@NgModule({
  declarations: [
    LayoutComponent,

    NamespacesFormPageComponent,
    NamespacesJsonPageComponent,
    NamespacesListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class NamespaceModule {}
