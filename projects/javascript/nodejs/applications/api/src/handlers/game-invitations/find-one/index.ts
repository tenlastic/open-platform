import { GameInvitationPermissions } from '@tenlastic/mongoose-models';

import { findOne } from '../../../defaults';

export const handler = findOne(GameInvitationPermissions);
