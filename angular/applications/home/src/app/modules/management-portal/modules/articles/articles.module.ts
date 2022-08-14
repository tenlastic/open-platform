import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import {
  ArticlesFormPageComponent,
  ArticlesJsonPageComponent,
  ArticlesListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { component: ArticlesListPageComponent, path: '', title: 'Articles' },
  {
    component: ArticlesFormPageComponent,
    data: { param: 'articleId', title: 'Article' },
    path: ':articleId',
    title: FormResolver,
  },
  {
    component: ArticlesJsonPageComponent,
    data: { param: 'articleId', title: 'Article' },
    path: ':articleId/json',
    title: FormResolver,
  },
];

@NgModule({
  declarations: [ArticlesFormPageComponent, ArticlesJsonPageComponent, ArticlesListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class ArticleModule {}
