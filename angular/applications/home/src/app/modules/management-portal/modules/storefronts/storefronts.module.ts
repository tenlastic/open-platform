import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { MediaDialogComponent } from './components';
import {
  StorefrontsFormPageComponent,
  StorefrontsJsonPageComponent,
  StorefrontsMultimediaFormPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', component: StorefrontsFormPageComponent },
  { path: 'json', component: StorefrontsJsonPageComponent },
  { path: 'multimedia', component: StorefrontsMultimediaFormPageComponent },
];

@NgModule({
  declarations: [
    MediaDialogComponent,
    StorefrontsFormPageComponent,
    StorefrontsJsonPageComponent,
    StorefrontsMultimediaFormPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class StorefrontModule {}
