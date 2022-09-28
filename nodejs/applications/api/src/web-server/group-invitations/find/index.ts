import { GroupInvitationPermissions } from '../../../mongodb';
import { find } from '@tenlastic/web-server';

export const handler = find(GroupInvitationPermissions);
