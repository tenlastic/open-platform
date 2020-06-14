import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { ArticlesFormPageComponent } from './pages/form/form-page.component';
import { ArticlesListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: ArticlesListPageComponent },
  { path: ':_id', component: ArticlesFormPageComponent },
];

@NgModule({
  declarations: [ArticlesFormPageComponent, ArticlesListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class ArticleModule {}
