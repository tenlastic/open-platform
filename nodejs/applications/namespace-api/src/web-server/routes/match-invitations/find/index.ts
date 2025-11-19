import { MatchInvitationModel, MatchInvitationPermissionOptions } from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(MatchInvitationModel, MatchInvitationPermissionOptions);
