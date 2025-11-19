import { WorkflowModel, WorkflowPermissionOptions } from '@tenlastic/mongoose';
import { count } from '@tenlastic/web-server';

export const handler = count(WorkflowModel, WorkflowPermissionOptions);
