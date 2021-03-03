import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { MediaDialogComponent } from './components';
import { GamesFormPageComponent, GamesListPageComponent } from './pages';

export const ROUTES: Routes = [
  { path: '', component: GamesListPageComponent },
  { path: ':_id', component: GamesFormPageComponent },
];

@NgModule({
  declarations: [GamesFormPageComponent, GamesListPageComponent, MediaDialogComponent],
  entryComponents: [MediaDialogComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GameModule {}
