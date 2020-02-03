import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthenticationModule, OAuthComponent } from '@tenlastic/ng-authentication';
import { ComponentLibraryModule } from '@tenlastic/ng-component-library';
import { ElectronModule } from '@tenlastic/ng-electron';
import { HttpModule } from '@tenlastic/ng-http';

import { environment } from '../environments/environment';
import { CoreModule } from './core/core.module';
import { LayoutComponent } from './shared/components';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';

export const ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/games' },
  {
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
    component: OAuthComponent,
    path: 'oauth',
  },
  {
    component: LayoutComponent,
    loadChildren: () => import('./modules/social/social.module').then(m => m.SocialModule),
    path: 'messages',
  },
];

@NgModule({
  declarations: [AppComponent],
  entryComponents: [AppComponent],
  imports: [
    AuthenticationModule.forRoot(environment),
    ComponentLibraryModule,
    CoreModule,
    ElectronModule,
    HttpModule.forRoot(environment),
    SharedModule,
    RouterModule.forRoot(ROUTES, { useHash: environment.useHash }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
