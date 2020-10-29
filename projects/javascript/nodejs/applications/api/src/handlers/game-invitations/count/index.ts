import { GameInvitationPermissions } from '@tenlastic/mongoose-models';

import { count } from '../../../defaults';

export const handler = count(GameInvitationPermissions);
