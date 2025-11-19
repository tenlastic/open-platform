import { WorkflowModel, WorkflowPermissionOptions } from '@tenlastic/mongoose';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(WorkflowModel, WorkflowPermissionOptions);
