import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { PipelineTemplatesFormPageComponent } from './pages/form/form-page.component';
import { PipelineTemplatesListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: PipelineTemplatesListPageComponent },
  { path: ':_id', component: PipelineTemplatesFormPageComponent },
];

@NgModule({
  declarations: [PipelineTemplatesFormPageComponent, PipelineTemplatesListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class PipelineTemplateModule {}
