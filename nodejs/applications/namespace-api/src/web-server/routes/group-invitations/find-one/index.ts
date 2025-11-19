import { GroupInvitationModel, GroupInvitationPermissionOptions } from '@tenlastic/mongoose';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(GroupInvitationModel, GroupInvitationPermissionOptions);
