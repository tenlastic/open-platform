import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { PlayNowComponent } from './play-now.component';

export const ROUTES: Routes = [{ path: '', component: PlayNowComponent }];

@NgModule({
  entryComponents: [],
  declarations: [PlayNowComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class PlayNowModule {}
