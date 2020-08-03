import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { ArticleDialogComponent, LayoutComponent, StatusComponent } from './components';
import { GameServersPageComponent, InformationPageComponent, QueuesPageComponent } from './pages';

export const ROUTES: Routes = [
  {
    children: [
      {
        component: InformationPageComponent,
        path: '',
        pathMatch: 'full',
      },
      {
        component: InformationPageComponent,
        path: ':_id',
        pathMatch: 'full',
      },
      {
        component: GameServersPageComponent,
        path: ':_id/game-servers',
      },
      {
        component: QueuesPageComponent,
        path: ':_id/queues',
      },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  declarations: [
    ArticleDialogComponent,
    GameServersPageComponent,
    InformationPageComponent,
    LayoutComponent,
    QueuesPageComponent,
    StatusComponent,
  ],
  entryComponents: [ArticleDialogComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GamesModule {}
