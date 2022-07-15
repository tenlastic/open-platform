import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { MediaDialogComponent } from './components';
import {
  GamesFormPageComponent,
  GamesJsonPageComponent,
  GamesListPageComponent,
  GamesMultimediaFormPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', component: GamesListPageComponent },
  { path: ':_id', component: GamesFormPageComponent },
  { path: ':_id/json', component: GamesJsonPageComponent },
  { path: ':_id/multimedia', component: GamesMultimediaFormPageComponent },
];

@NgModule({
  declarations: [
    GamesFormPageComponent,
    GamesJsonPageComponent,
    GamesListPageComponent,
    GamesMultimediaFormPageComponent,
    MediaDialogComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GameModule {}
