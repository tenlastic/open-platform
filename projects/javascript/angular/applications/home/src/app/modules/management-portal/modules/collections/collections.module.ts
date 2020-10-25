import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { CriterionFieldComponent, PropertyFieldComponent, RoleFieldComponent } from './components';
import { CollectionsFormPageComponent, CollectionsListPageComponent } from './pages';

export const ROUTES: Routes = [
  { path: '', component: CollectionsListPageComponent },
  {
    path: ':collectionId/records',
    loadChildren: () => import('../records/records.module').then(m => m.RecordModule),
  },
  { path: ':_id', component: CollectionsFormPageComponent },
];

@NgModule({
  declarations: [
    CriterionFieldComponent,
    PropertyFieldComponent,
    RoleFieldComponent,

    CollectionsFormPageComponent,
    CollectionsListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class CollectionModule {}
