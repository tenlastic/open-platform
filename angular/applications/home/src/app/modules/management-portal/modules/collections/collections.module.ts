import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
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
  { component: CollectionsListPageComponent, path: '', title: 'Collections' },
  {
    children: [
      {
        component: CollectionsFormPageComponent,
        data: { param: 'collectionId', title: 'Collection' },
        path: '',
        title: FormResolver,
      },
      {
        component: CollectionsJsonPageComponent,
        data: { param: 'collectionId', title: 'Collection' },
        path: 'json',
        title: FormResolver,
      },
      {
        loadChildren: () => import('../records/records.module').then((m) => m.RecordModule),
        path: 'records',
      },
    ],
    component: LayoutComponent,
    path: ':collectionId',
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
