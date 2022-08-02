import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { LayoutComponent, MediaDialogComponent } from './components';
import {
  StorefrontsFormPageComponent,
  StorefrontsJsonPageComponent,
  StorefrontsMultimediaFormPageComponent,
} from './pages';

export const ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: StorefrontsFormPageComponent },
      { path: 'json', component: StorefrontsJsonPageComponent },
    ],
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
