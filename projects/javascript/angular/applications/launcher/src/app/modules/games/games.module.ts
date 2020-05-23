import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ComponentLibraryModule } from '@tenlastic/ng-component-library';

import { SharedModule } from '../../shared/shared.module';
import { ArticleDialogComponent, LayoutComponent, StatusComponent } from './components';
import { GameServersPageComponent, InformationPageComponent } from './pages';

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
        path: ':slug',
        pathMatch: 'full',
      },
      {
        component: GameServersPageComponent,
        path: ':slug/game-servers',
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
    StatusComponent,
  ],
  entryComponents: [ArticleDialogComponent],
  imports: [ComponentLibraryModule, SharedModule, RouterModule.forChild(ROUTES)],
})
export class GamesModule {}
