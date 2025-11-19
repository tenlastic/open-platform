import { WorkflowModel, WorkflowPermissionOptions } from '@tenlastic/mongoose';
import { findLogs } from '@tenlastic/web-server';

export const handler = findLogs(WorkflowModel, WorkflowPermissionOptions);
