import { QueuePermissions } from '@tenlastic/mongoose-models';

import { count } from '../../../defaults';

export const handler = count(QueuePermissions);
