import { ReleaseTaskPermissions } from '@tenlastic/mongoose-models';

import { deleteOne } from '../../../defaults';

export const handler = deleteOne(ReleaseTaskPermissions);
