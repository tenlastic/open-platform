import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CoreModule } from '@app/core/core.module';
import { LayoutComponent } from '@app/core/components';
import { LoginGuard } from '@app/core/guards';
import { SharedModule } from '@app/shared/shared.module';

import { AppComponent } from './app.component';

export const ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/namespaces' },
  {
    path: 'databases',
    component: LayoutComponent,
    loadChildren: './modules/databases/databases.module#DatabaseModule',
    canActivate: [LoginGuard],
  },
  {
    path: 'login',
    loadChildren: './modules/login/login.module#LoginModule',
  },
  {
    path: 'namespaces',
    component: LayoutComponent,
    loadChildren: './modules/namespaces/namespaces.module#NamespaceModule',
    canActivate: [LoginGuard],
  },
  {
    path: 'reset-password/:hash',
    loadChildren: './modules/login/login.module#LoginModule',
  },
  {
    path: 'users',
    component: LayoutComponent,
    loadChildren: './modules/users/users.module#UserModule',
    canActivate: [LoginGuard],
  },
];

@NgModule({
  declarations: [AppComponent],
  entryComponents: [AppComponent],
  imports: [CoreModule, SharedModule, RouterModule.forRoot(ROUTES)],
  providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
