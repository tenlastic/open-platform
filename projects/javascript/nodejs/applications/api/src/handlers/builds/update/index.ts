import { BuildPermissions } from '@tenlastic/mongoose-models';

import { updateOne } from '../../../defaults';

export const handler = updateOne(BuildPermissions);
