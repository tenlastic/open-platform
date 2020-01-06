import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthenticationModule, LoginGuard, OAuthComponent } from '@tenlastic/ng-authentication';
import { HttpModule } from '@tenlastic/ng-http';

import { environment } from '../environments/environment';
import { CoreModule } from './core/core.module';
import { LayoutComponent } from './shared/components';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';

export const ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/namespaces' },
  {
    path: 'databases',
    component: LayoutComponent,
    loadChildren: () => import('./modules/databases/databases.module').then(m => m.DatabaseModule),
    canActivate: [LoginGuard],
  },
  {
    path: 'login',
    loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule),
  },
  {
    path: 'namespaces',
    component: LayoutComponent,
    loadChildren: () =>
      import('./modules/namespaces/namespaces.module').then(m => m.NamespaceModule),
    canActivate: [LoginGuard],
  },
  {
    path: 'oauth',
    component: OAuthComponent,
  },
  {
    path: 'reset-password/:hash',
    loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule),
  },
  {
    path: 'users',
    component: LayoutComponent,
    loadChildren: () => import('./modules/users/users.module').then(m => m.UserModule),
    canActivate: [LoginGuard],
  },
];

@NgModule({
  declarations: [AppComponent],
  entryComponents: [AppComponent],
  imports: [
    AuthenticationModule.forRoot(environment),
    CoreModule,
    HttpModule.forRoot(environment),
    SharedModule,
    RouterModule.forRoot(ROUTES),
  ],
  providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
