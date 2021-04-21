import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { QueuesFormPageComponent } from './pages/form/form-page.component';
import { QueuesListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: QueuesListPageComponent },
  { path: ':_id', component: QueuesFormPageComponent },
  {
    path: ':queueId/game-servers',
    loadChildren: () => import('../game-servers/game-servers.module').then(m => m.GameServerModule),
  },
  {
    path: ':queueId/members',
    loadChildren: () =>
      import('../queue-members/queue-members.module').then(m => m.QueueMemberModule),
  },
];

@NgModule({
  declarations: [QueuesFormPageComponent, QueuesListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class QueueModule {}
