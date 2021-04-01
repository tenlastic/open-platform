import { GameInvitationPermissions } from '@tenlastic/mongoose-models';
import { count } from '@tenlastic/web-server';

export const handler = count(GameInvitationPermissions);
