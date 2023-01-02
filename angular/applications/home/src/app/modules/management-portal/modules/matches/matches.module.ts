import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import {
  MatchesFormPageComponent,
  MatchesJsonPageComponent,
  MatchesListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { component: MatchesListPageComponent, path: '', title: 'Matches' },
  {
    children: [
      {
        component: MatchesFormPageComponent,
        data: { param: 'matchId', title: 'Match' },
        path: '',
        title: FormResolver,
      },
      {
        component: MatchesJsonPageComponent,
        data: { param: 'matchId', title: 'Match' },
        path: 'json',
        title: FormResolver,
      },
    ],
    path: ':matchId',
  },
];

@NgModule({
  declarations: [MatchesFormPageComponent, MatchesJsonPageComponent, MatchesListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class MatchModule {}
