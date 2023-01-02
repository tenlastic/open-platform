import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { LayoutComponent } from './components';

export const ROUTES: Routes = [
  {
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'namespaces' },
      {
        path: 'authorizations',
        loadChildren: () =>
          import('./modules/authorizations/authorizations.module').then(
            (m) => m.AuthorizationModule,
          ),
      },
      {
        path: 'authorization-requests',
        loadChildren: () =>
          import('./modules/authorization-requests/authorization-requests.module').then(
            (m) => m.AuthorizationRequestModule,
          ),
      },
      {
        path: 'namespaces',
        loadChildren: () =>
          import('./modules/namespaces/namespaces.module').then((m) => m.NamespaceModule),
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
