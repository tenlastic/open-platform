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
        loadChildren: () =>
          import('../game-server-templates/game-server-templates.module').then(
            (m) => m.GameServerTemplateModule,
          ),
        path: 'game-server-templates',
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
        loadChildren: () =>
          import('../queue-members/queue-members.module').then((m) => m.QueueMemberModule),
        path: 'queue-members',
      },
      {
        loadChildren: () => import('../queues/queues.module').then((m) => m.QueueModule),
        path: 'queues',
      },
      {
        path: 'steam-integrations',
        loadChildren: () =>
          import('../steam-integrations/steam-integrations.module').then(
            (m) => m.SteamIntegrationModule,
          ),
      },
      {
        loadChildren: () =>
          import('../storefronts/storefronts.module').then((m) => m.StorefrontModule),
        path: 'storefront',
      },
      {
        loadChildren: () => import('../teams/teams.module').then((m) => m.TeamModule),
        path: 'teams',
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
