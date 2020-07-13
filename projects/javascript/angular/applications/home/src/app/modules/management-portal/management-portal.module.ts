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
        loadChildren: () => import('./modules/articles/articles.module').then(m => m.ArticleModule),
      },
      {
        path: 'databases',
        loadChildren: () =>
          import('./modules/databases/databases.module').then(m => m.DatabaseModule),
      },
      {
        path: 'game-invitations',
        loadChildren: () =>
          import('./modules/game-invitations/game-invitations.module').then(
            m => m.GameInvitationModule,
          ),
      },
      {
        path: 'game-servers',
        loadChildren: () =>
          import('./modules/game-servers/game-servers.module').then(m => m.GameServerModule),
      },
      {
        path: 'games',
        loadChildren: () => import('./modules/games/games.module').then(m => m.GameModule),
      },
      {
        path: 'namespaces',
        loadChildren: () =>
          import('./modules/namespaces/namespaces.module').then(m => m.NamespaceModule),
      },
      {
        path: 'refresh-tokens',
        loadChildren: () =>
          import('./modules/refresh-tokens/refresh-tokens.module').then(m => m.RefreshTokenModule),
      },
      {
        path: 'releases',
        loadChildren: () => import('./modules/releases/releases.module').then(m => m.ReleaseModule),
      },
      {
        path: 'users',
        loadChildren: () => import('./modules/users/users.module').then(m => m.UserModule),
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
