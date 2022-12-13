import { MatchInvitationPermissions } from '@tenlastic/mongoose';
import { updateOneDate } from '@tenlastic/web-server';

export const handler = updateOneDate('acceptedAt', MatchInvitationPermissions);
