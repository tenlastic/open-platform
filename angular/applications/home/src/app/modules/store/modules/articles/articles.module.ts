import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { LayoutComponent } from './components';
import { ListPageComponent, ViewPageComponent } from './pages';

export const ROUTES: Routes = [
  {
    children: [
      {
        component: ListPageComponent,
        path: '',
      },
      {
        component: ViewPageComponent,
        path: ':articleId',
      },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  declarations: [LayoutComponent, ListPageComponent, ViewPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class ArticlesModule {}
