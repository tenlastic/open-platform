import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { PipelinesFormPageComponent } from './pages/form/form-page.component';
import { PipelinesListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: PipelinesListPageComponent },
  { path: ':_id', component: PipelinesFormPageComponent },
];

@NgModule({
  declarations: [PipelinesFormPageComponent, PipelinesListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class PipelinesModule {}
