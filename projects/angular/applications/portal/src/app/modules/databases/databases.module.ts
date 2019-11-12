import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '@app/shared/shared.module';

import { DatabasesFormPageComponent } from './pages/form/form-page.component';
import { DatabasesListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: DatabasesListPageComponent },
  {
    path: ':databaseName/collections',
    loadChildren: '../collections/collections.module#CollectionModule',
  },
  { path: ':name', component: DatabasesFormPageComponent },
];

@NgModule({
  declarations: [DatabasesFormPageComponent, DatabasesListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class DatabaseModule {}
