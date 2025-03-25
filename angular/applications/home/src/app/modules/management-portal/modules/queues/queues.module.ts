import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import { LayoutComponent, ThresholdFieldsComponent } from './components';
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
        loadChildren: () => import('../matches/matches.module').then((m) => m.MatchModule),
        path: 'matches',
      },
      {
        loadChildren: () =>
          import('../queue-members/queue-members.module').then((m) => m.QueueMemberModule),
        path: 'queue-members',
      },
      {
        loadChildren: () => import('../teams/teams.module').then((m) => m.TeamModule),
        path: 'teams',
      },
    ],
    component: LayoutComponent,
    path: ':queueId',
  },
];

@NgModule({
  declarations: [
    LayoutComponent,
    ThresholdFieldsComponent,

    QueuesFormPageComponent,
    QueuesJsonPageComponent,
    QueuesListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class QueueModule {}
