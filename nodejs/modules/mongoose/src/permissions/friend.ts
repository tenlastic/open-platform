import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Friend, FriendDocument } from '../models';

export const FriendPermissions = new MongoosePermissions<FriendDocument>(Friend, {
  create: {
    owner: ['fromUserId', 'toUserId'],
  },
  delete: {
    owner: true,
  },
  find: {
    default: { fromUserId: { $ref: 'user._id' } },
  },
  read: {
    default: ['_id', 'createdAt', 'fromUserId', 'toUserId', 'updatedAt'],
  },
  roles: {
    default: {},
    owner: { 'record.fromUserId': { $ref: 'user._id' } },
  },
});