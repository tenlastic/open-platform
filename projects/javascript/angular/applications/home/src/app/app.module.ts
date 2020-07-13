import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { HttpModule } from '@tenlastic/ng-http';

import { environment } from '../environments/environment';
import { CoreModule } from './core/core.module';
import { GameGuard, LoginGuard, NamespaceGuard } from './core/guards';
import { LayoutComponent } from './shared/components';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';

export const ROUTES: Routes = [
  {
    canActivate: [LoginGuard],
    component: LayoutComponent,
    loadChildren: () => import('./modules/account/account.module').then(m => m.AccountModule),
    path: 'account',
  },
  {
    component: LayoutComponent,
    loadChildren: () =>
      import('./modules/authentication/authentication.module').then(m => m.AuthenticationModule),
    path: 'authentication',
  },
  {
    component: LayoutComponent,
    loadChildren: () => import('./modules/games/games.module').then(m => m.GamesModule),
    path: 'games',
  },
  {
    canActivate: [LoginGuard, GameGuard, NamespaceGuard],
    component: LayoutComponent,
    loadChildren: () =>
      import('./modules/management-portal/management-portal.module').then(
        m => m.ManagementPortalModule,
      ),
    path: 'management-portal',
  },
  {
    component: LayoutComponent,
    loadChildren: () => import('./modules/home/home.module').then(m => m.HomeModule),
    path: '',
  },
];

@NgModule({
  declarations: [AppComponent],
  entryComponents: [AppComponent],
  imports: [
    environment.production ? [] : AkitaNgDevtools,
    CoreModule,
    HttpModule.forRoot(environment),
    SharedModule,
    RouterModule.forRoot(ROUTES, { useHash: environment.useHash }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
