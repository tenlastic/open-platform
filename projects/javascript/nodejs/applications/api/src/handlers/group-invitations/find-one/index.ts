import { GroupInvitationPermissions } from '@tenlastic/mongoose-models';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(GroupInvitationPermissions);
