import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ComponentLibraryModule } from '@tenlastic/ng-component-library';

import { SharedModule } from '../../shared/shared.module';
import { ArticleDialogComponent, LayoutComponent, StatusComponent } from './components';
import { InformationPageComponent } from './pages';

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
      },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  declarations: [
    ArticleDialogComponent,
    LayoutComponent,
    InformationPageComponent,
    StatusComponent,
  ],
  entryComponents: [ArticleDialogComponent],
  imports: [ComponentLibraryModule, SharedModule, RouterModule.forChild(ROUTES)],
})
export class GamesModule {}
