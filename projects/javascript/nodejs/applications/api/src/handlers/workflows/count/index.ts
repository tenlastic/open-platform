import { WorkflowPermissions } from '@tenlastic/mongoose-models';

import { count } from '../../../defaults';

export const handler = count(WorkflowPermissions);