import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthenticationModule, LoginGuard, OAuthComponent } from '@tenlastic/ng-authentication';
import { ComponentLibraryModule } from '@tenlastic/ng-component-library';
import { HttpModule } from '@tenlastic/ng-http';

import { environment } from '../environments/environment';
import { CoreModule } from './core/core.module';
import { LayoutComponent } from './shared/components';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';

export const ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/account' },
  {
    canActivate: [LoginGuard],
    component: LayoutComponent,
    loadChildren: () => import('./modules/account/account.module').then(m => m.AccountModule),
    path: 'account',
  },
  {
    canActivate: [LoginGuard],
    component: LayoutComponent,
    loadChildren: () => import('./modules/games/games.module').then(m => m.GamesModule),
    path: 'games',
  },
  {
    component: OAuthComponent,
    path: 'oauth',
  },
];

@NgModule({
  declarations: [AppComponent],
  entryComponents: [AppComponent],
  imports: [
    AuthenticationModule.forRoot(environment),
    ComponentLibraryModule,
    CoreModule,
    HttpModule.forRoot(environment),
    SharedModule,
    RouterModule.forRoot(ROUTES),
  ],
  providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
