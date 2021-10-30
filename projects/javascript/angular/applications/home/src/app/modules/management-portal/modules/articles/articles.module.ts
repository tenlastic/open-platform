import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import {
  ArticlesFormPageComponent,
  ArticlesJsonPageComponent,
  ArticlesListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', component: ArticlesListPageComponent },
  { path: ':_id', component: ArticlesFormPageComponent },
  { path: ':_id/json', component: ArticlesJsonPageComponent },
];

@NgModule({
  declarations: [ArticlesFormPageComponent, ArticlesJsonPageComponent, ArticlesListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class ArticleModule {}
