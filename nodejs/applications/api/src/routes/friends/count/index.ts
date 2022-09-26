import { FriendPermissions } from '../../../mongodb';
import { count } from '@tenlastic/web-server';

export const handler = count(FriendPermissions);
