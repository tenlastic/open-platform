import { WorkflowModel, WorkflowPermissionOptions } from '@tenlastic/mongoose';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(WorkflowModel, WorkflowPermissionOptions);
