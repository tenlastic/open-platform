import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { LayoutComponent, NamespaceUserFieldComponent } from './components';
import {
  NamespacesFormPageComponent,
  NamespacesJsonPageComponent,
  NamespacesListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', component: NamespacesListPageComponent },
  {
    path: ':namespaceId',
    component: LayoutComponent,
    children: [
      { path: '', component: NamespacesFormPageComponent },
      {
        path: 'api-keys',
        loadChildren: () =>
          import('../authorizations/authorizations.module').then((m) => m.AuthorizationModule),
      },
      {
        path: 'articles',
        loadChildren: () => import('../articles/articles.module').then((m) => m.ArticleModule),
      },
      {
        path: 'builds',
        loadChildren: () => import('../builds/builds.module').then((m) => m.BuildModule),
      },
      {
        path: 'collections',
        loadChildren: () =>
          import('../collections/collections.module').then((m) => m.CollectionModule),
      },
      {
        path: 'game-servers',
        loadChildren: () =>
          import('../game-servers/game-servers.module').then((m) => m.GameServerModule),
      },
      {
        path: 'games',
        loadChildren: () => import('../games/games.module').then((m) => m.GameModule),
      },
      { path: 'json', component: NamespacesJsonPageComponent },
      {
        path: 'queues',
        loadChildren: () => import('../queues/queues.module').then((m) => m.QueueModule),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('../authorizations/authorizations.module').then((m) => m.AuthorizationModule),
      },
      {
        path: 'workflows',
        loadChildren: () => import('../workflows/workflows.module').then((m) => m.WorkflowsModule),
      },
    ],
  },
];

@NgModule({
  declarations: [
    LayoutComponent,
    NamespaceUserFieldComponent,

    NamespacesFormPageComponent,
    NamespacesJsonPageComponent,
    NamespacesListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class NamespaceModule {}
