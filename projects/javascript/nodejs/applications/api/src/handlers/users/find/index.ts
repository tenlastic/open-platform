import { UserPermissions } from '@tenlastic/mongoose-models';

import { find } from '../../../defaults';

export const handler = find(UserPermissions);
