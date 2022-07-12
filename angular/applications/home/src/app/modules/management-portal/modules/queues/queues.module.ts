import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { LayoutComponent } from './components';
import { QueuesFormPageComponent, QueuesJsonPageComponent, QueuesListPageComponent } from './pages';

export const ROUTES: Routes = [
  { path: '', component: QueuesListPageComponent },
  {
    path: ':queueId',
    component: LayoutComponent,
    children: [
      { path: '', component: QueuesFormPageComponent },
      { path: 'json', component: QueuesJsonPageComponent },
      {
        path: 'game-servers',
        loadChildren: () =>
          import('../game-servers/game-servers.module').then((m) => m.GameServerModule),
      },
      {
        path: 'queue-members',
        loadChildren: () =>
          import('../queue-members/queue-members.module').then((m) => m.QueueMemberModule),
      },
    ],
  },
];

@NgModule({
  declarations: [
    LayoutComponent,

    QueuesFormPageComponent,
    QueuesJsonPageComponent,
    QueuesListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class QueueModule {}
