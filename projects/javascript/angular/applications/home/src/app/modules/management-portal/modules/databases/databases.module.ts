import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { DatabasesFormPageComponent, DatabasesListPageComponent } from './pages';

export const ROUTES: Routes = [
  { path: '', component: DatabasesListPageComponent },
  { path: ':_id', component: DatabasesFormPageComponent },
  {
    path: ':databaseId/collections',
    loadChildren: () => import('../collections/collections.module').then(m => m.CollectionModule),
  },
];

@NgModule({
  declarations: [DatabasesFormPageComponent, DatabasesListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class DatabaseModule {}
