import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import {
  RecordsFormPageComponent,
  RecordsJsonPageComponent,
  RecordsListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { component: RecordsListPageComponent, path: '', title: 'Records' },
  {
    component: RecordsFormPageComponent,
    data: { param: 'recordId', title: 'Record' },
    path: ':recordId',
    title: FormResolver,
  },
  {
    component: RecordsJsonPageComponent,
    data: { param: 'recordId', title: 'Record' },
    path: ':recordId/json',
    title: FormResolver,
  },
];

@NgModule({
  declarations: [RecordsFormPageComponent, RecordsJsonPageComponent, RecordsListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class RecordModule {}
