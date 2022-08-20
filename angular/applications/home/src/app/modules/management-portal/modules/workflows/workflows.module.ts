import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
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
  { component: WorkflowsListPageComponent, path: '', title: 'Workflows' },
  {
    component: WorkflowsFormPageComponent,
    data: { param: 'workflowId', title: 'Workflow' },
    path: ':workflowId',
    title: FormResolver,
  },
  {
    component: WorkflowsJsonPageComponent,
    data: { param: 'workflowId', title: 'Workflow' },
    path: ':workflowId/json',
    title: FormResolver,
  },
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
