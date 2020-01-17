import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthenticationModule } from '@tenlastic/ng-authentication';
import { ComponentLibraryModule } from '@tenlastic/ng-component-library';
import { ElectronModule } from '@tenlastic/ng-electron';
import { HttpModule } from '@tenlastic/ng-http';

import { environment } from '../environments/environment';
import { CoreModule } from './core/core.module';
import { LayoutComponent } from './shared/components';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';

export const ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/login' },
  {
    component: LayoutComponent,
    loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule),
    path: 'login',
  },
  {
    component: LayoutComponent,
    loadChildren: () => import('./modules/logout/logout.module').then(m => m.LogoutModule),
    path: 'logout',
  },
  {
    component: LayoutComponent,
    loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule),
    path: 'reset-password/:hash',
  },
];

@NgModule({
  declarations: [AppComponent],
  entryComponents: [AppComponent],
  imports: [
    AuthenticationModule,
    ComponentLibraryModule,
    CoreModule,
    ElectronModule,
    HttpModule.forRoot(environment),
    SharedModule,
    RouterModule.forRoot(ROUTES),
  ],
  providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
