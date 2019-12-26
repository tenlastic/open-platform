import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { PatchNotesComponent } from './patch-notes.component';

export const ROUTES: Routes = [{ path: '', component: PatchNotesComponent }];

@NgModule({
  entryComponents: [],
  declarations: [PatchNotesComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class PatchNotesModule {}
