import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import { LayoutComponent, MediaDialogComponent } from './components';
import {
  StorefrontsFormPageComponent,
  StorefrontsJsonPageComponent,
  StorefrontsMultimediaFormPageComponent,
} from './pages';

export const ROUTES: Routes = [
  {
    children: [
      {
        component: StorefrontsFormPageComponent,
        data: { param: 'storefrontId', title: 'Storefront' },
        path: '',
        title: FormResolver,
      },
      {
        component: StorefrontsJsonPageComponent,
        data: { param: 'storefrontId', title: 'Storefront' },
        path: 'json',
        title: FormResolver,
      },
      {
        component: StorefrontsMultimediaFormPageComponent,
        path: 'multimedia',
      },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  declarations: [
    LayoutComponent,
    MediaDialogComponent,

    StorefrontsFormPageComponent,
    StorefrontsJsonPageComponent,
    StorefrontsMultimediaFormPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class StorefrontModule {}
