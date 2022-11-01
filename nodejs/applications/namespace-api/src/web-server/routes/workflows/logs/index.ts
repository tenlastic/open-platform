import { WorkflowPermissions } from '../../../../mongodb';
import { logs } from '@tenlastic/web-server';

export const handler = logs(WorkflowPermissions);
