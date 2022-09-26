import { FriendPermissions } from '../../../mongodb';
import { create } from '@tenlastic/web-server';

export const handler = create(FriendPermissions);
