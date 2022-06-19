import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import {
  RecordsFormPageComponent,
  RecordsJsonPageComponent,
  RecordsListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', component: RecordsListPageComponent },
  { path: ':_id', component: RecordsFormPageComponent },
  { path: ':_id/json', component: RecordsJsonPageComponent },
];

@NgModule({
  declarations: [RecordsFormPageComponent, RecordsJsonPageComponent, RecordsListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class RecordModule {}
