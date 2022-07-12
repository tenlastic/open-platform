import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import {
  WorkflowEnvironmentVariablesFormComponent,
  WorkflowScriptFormComponent,
  WorkflowSidecarsFormComponent,
  WorkflowStatusNodeComponent,
} from './components';
import {
  WorkflowsFormPageComponent,
  WorkflowsJsonPageComponent,
  WorkflowsListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', component: WorkflowsListPageComponent },
  { path: ':workflowId', component: WorkflowsFormPageComponent },
  { path: ':workflowId/json', component: WorkflowsJsonPageComponent },
];

@NgModule({
  declarations: [
    WorkflowEnvironmentVariablesFormComponent,
    WorkflowScriptFormComponent,
    WorkflowSidecarsFormComponent,
    WorkflowStatusNodeComponent,

    WorkflowsFormPageComponent,
    WorkflowsJsonPageComponent,
    WorkflowsListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class WorkflowsModule {}
