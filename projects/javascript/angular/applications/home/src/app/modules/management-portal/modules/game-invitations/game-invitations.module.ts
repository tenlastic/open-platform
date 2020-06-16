import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { GameInvitationsFormPageComponent } from './pages/form/form-page.component';
import { GameInvitationsListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: GameInvitationsListPageComponent },
  { path: ':_id', component: GameInvitationsFormPageComponent },
];

@NgModule({
  declarations: [GameInvitationsFormPageComponent, GameInvitationsListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GameInvitationModule {}
