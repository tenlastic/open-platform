import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { RecordsFormPageComponent } from './pages/form/form-page.component';
import { RecordsListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: RecordsListPageComponent },
  { path: ':_id', component: RecordsFormPageComponent },
];

@NgModule({
  declarations: [RecordsFormPageComponent, RecordsListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class RecordModule {}
