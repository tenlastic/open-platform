import { RefreshTokenPermissions } from '@tenlastic/mongoose-models';

import { findOne } from '../../../defaults';

export const handler = findOne(RefreshTokenPermissions);
