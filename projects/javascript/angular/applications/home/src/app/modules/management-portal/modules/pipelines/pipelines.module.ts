import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import {
  PipelineEnvironmentVariablesFormComponent,
  PipelineScriptFormComponent,
  PipelineSidecarsFormComponent,
} from './components';
import { PipelinesFormPageComponent } from './pages/form/form-page.component';
import { PipelinesListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: PipelinesListPageComponent },
  { path: ':_id', component: PipelinesFormPageComponent },
];

@NgModule({
  declarations: [
    PipelineEnvironmentVariablesFormComponent,
    PipelineScriptFormComponent,
    PipelineSidecarsFormComponent,

    PipelinesFormPageComponent,
    PipelinesListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class PipelinesModule {}
