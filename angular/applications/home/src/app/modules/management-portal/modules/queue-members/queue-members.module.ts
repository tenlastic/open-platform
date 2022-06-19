import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { QueueMembersListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [{ path: '', component: QueueMembersListPageComponent }];

@NgModule({
  declarations: [QueueMembersListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class QueueMemberModule {}
