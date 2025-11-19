import { MatchInvitationModel, MatchInvitationPermissionOptions } from '@tenlastic/mongoose';
import { count } from '@tenlastic/web-server';

export const handler = count(MatchInvitationModel, MatchInvitationPermissionOptions);
