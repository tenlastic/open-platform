import { WorkflowPermissions } from '@tenlastic/mongoose';
import { logs } from '@tenlastic/web-server';

export const handler = logs(WorkflowPermissions);
