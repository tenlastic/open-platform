import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';

import { GamesFormPageComponent } from './pages/form/form-page.component';
import { GamesListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: GamesListPageComponent },
  {
    path: ':gameSlug/articles',
    loadChildren: () => import('../articles/articles.module').then(m => m.ArticleModule),
  },
  { path: ':slug', component: GamesFormPageComponent },
];

@NgModule({
  declarations: [GamesFormPageComponent, GamesListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class GameModule {}
