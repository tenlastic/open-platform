import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { LayoutComponent } from './components';

export const ROUTES: Routes = [
  {
    children: [
      {
        loadChildren: () => import('./pages/home/home.module').then((m) => m.HomeModule),
        path: '',
        pathMatch: 'full',
      },
      {
        loadChildren: () =>
          import('./pages/api-documentation/api-documentation.module').then(
            (m) => m.ApiDocumentationModule,
          ),
        path: 'api-documentation',
      },
      {
        loadChildren: () =>
          import('./pages/contact-us/contact-us.module').then((m) => m.ContactUsModule),
        path: 'contact-us',
      },
      {
        loadChildren: () =>
          import('./pages/web-socket-documentation/web-socket-documentation.module').then(
            (m) => m.WebSocketDocumentationModule,
          ),
        path: 'web-socket-documentation',
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
export class HomeModule {}
