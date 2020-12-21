import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import {
  WorkflowEnvironmentVariablesFormComponent,
  WorkflowScriptFormComponent,
  WorkflowSidecarsFormComponent,
} from './components';
import { WorkflowsFormPageComponent } from './pages/form/form-page.component';
import { WorkflowsListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: WorkflowsListPageComponent },
  { path: ':_id', component: WorkflowsFormPageComponent },
];

@NgModule({
  declarations: [
    WorkflowEnvironmentVariablesFormComponent,
    WorkflowScriptFormComponent,
    WorkflowSidecarsFormComponent,

    WorkflowsFormPageComponent,
    WorkflowsListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class WorkflowsModule {}
