import { FriendPermissions } from '@tenlastic/mongoose-models';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(FriendPermissions);
