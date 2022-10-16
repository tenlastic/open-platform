import { NgModule } from '@angular/core';
import { Routes, RouterModule, TitleStrategy } from '@angular/router';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';

import { environment } from '../environments/environment';
import { CoreModule } from './core/core.module';
import { IdentityGuard, LoginGuard } from './core/guards';
import { DefaultTitleStrategy } from './core/title-strategies';
import { LayoutComponent } from './shared/components';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';

export const ROUTES: Routes = [
  {
    children: [
      {
        canActivate: [IdentityGuard, LoginGuard],
        loadChildren: () => import('./modules/account/account.module').then((m) => m.AccountModule),
        path: 'account',
      },
      {
        loadChildren: () =>
          import('./modules/authentication/authentication.module').then(
            (m) => m.AuthenticationModule,
          ),
        path: 'authentication',
      },
      {
        canActivate: [IdentityGuard, LoginGuard],
        loadChildren: () =>
          import('./modules/management-portal/management-portal.module').then(
            (m) => m.ManagementPortalModule,
          ),
        path: 'management-portal',
      },
      {
        canActivate: [IdentityGuard],
        loadChildren: () => import('./modules/store/store.module').then((m) => m.StoreModule),
        path: 'store',
      },
      {
        canActivate: [IdentityGuard],
        loadChildren: () => import('./modules/home/home.module').then((m) => m.HomeModule),
        path: '',
      },
      { path: '**', redirectTo: '' },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  bootstrap: [AppComponent],
  declarations: [AppComponent],
  imports: [
    environment.production ? [] : AkitaNgDevtools,
    CoreModule,
    SharedModule,
    RouterModule.forRoot(ROUTES, {
      paramsInheritanceStrategy: 'always',
      relativeLinkResolution: 'corrected',
      useHash: environment.useHash,
    }),
  ],
  providers: [{ provide: TitleStrategy, useClass: DefaultTitleStrategy }],
})
export class AppModule {}
