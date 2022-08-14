import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import { LayoutComponent } from './components';
import { QueuesFormPageComponent, QueuesJsonPageComponent, QueuesListPageComponent } from './pages';

export const ROUTES: Routes = [
  { component: QueuesListPageComponent, path: '', title: 'Queues' },
  {
    children: [
      {
        component: QueuesFormPageComponent,
        data: { param: 'queueId', title: 'Queue' },
        path: '',
        title: FormResolver,
      },
      {
        loadChildren: () =>
          import('../game-servers/game-servers.module').then((m) => m.GameServerModule),
        path: 'game-servers',
      },
      {
        component: QueuesJsonPageComponent,
        data: { param: 'queueId', title: 'Queue' },
        path: 'json',
        title: FormResolver,
      },
      {
        loadChildren: () =>
          import('../queue-members/queue-members.module').then((m) => m.QueueMemberModule),
        path: 'queue-members',
      },
    ],
    component: LayoutComponent,
    path: ':queueId',
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
