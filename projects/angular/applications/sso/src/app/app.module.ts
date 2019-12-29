import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthenticationModule } from '@tenlastic/ng-authentication';
import { HttpModule } from '@tenlastic/ng-http';

import { environment } from '../environments/environment';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';

export const ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/login' },
  {
    path: 'login',
    loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule),
  },
  {
    path: 'logout',
    loadChildren: () => import('./modules/logout/logout.module').then(m => m.LogoutModule),
  },
  {
    path: 'reset-password/:hash',
    loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule),
  },
];

@NgModule({
  declarations: [AppComponent],
  entryComponents: [AppComponent],
  imports: [
    AuthenticationModule,
    CoreModule,
    HttpModule.forRoot(environment),
    SharedModule,
    RouterModule.forRoot(ROUTES),
  ],
  providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
