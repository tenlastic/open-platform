import { QueueMemberPermissions } from '@tenlastic/mongoose-models';

import { find } from '../../../defaults';

export const handler = find(QueueMemberPermissions);
