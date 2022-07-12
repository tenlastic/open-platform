import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import {
  CriterionFieldComponent,
  LayoutComponent,
  PropertyFieldComponent,
  RoleFieldComponent,
} from './components';
import {
  CollectionsFormPageComponent,
  CollectionsJsonPageComponent,
  CollectionsListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', component: CollectionsListPageComponent },
  {
    path: ':collectionId',
    component: LayoutComponent,
    children: [
      { path: '', component: CollectionsFormPageComponent },
      { path: 'json', component: CollectionsJsonPageComponent },
      {
        path: 'records',
        loadChildren: () => import('../records/records.module').then((m) => m.RecordModule),
      },
    ],
  },
];

@NgModule({
  declarations: [
    CriterionFieldComponent,
    LayoutComponent,
    PropertyFieldComponent,
    RoleFieldComponent,

    CollectionsFormPageComponent,
    CollectionsJsonPageComponent,
    CollectionsListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class CollectionModule {}
