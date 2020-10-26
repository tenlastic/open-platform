import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { MediaDialogComponent } from './components';
import { GamesFormPageComponent } from './pages/form/form-page.component';

export const ROUTES: Routes = [{ path: '', component: GamesFormPageComponent }];

@NgModule({
  declarations: [GamesFormPageComponent, MediaDialogComponent],
  entryComponents: [MediaDialogComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GameModule {}
