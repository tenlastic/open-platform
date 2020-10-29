import { QueueMemberPermissions } from '@tenlastic/mongoose-models';

import { count } from '../../../defaults';

export const handler = count(QueueMemberPermissions);
