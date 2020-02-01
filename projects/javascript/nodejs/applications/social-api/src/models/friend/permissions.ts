import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Friend, FriendDocument } from './model';

export const FriendPermissions = new MongoosePermissions<FriendDocument>(Friend, {
  create: {
    roles: {
      owner: ['fromUserId', 'toUserId'],
    },
  },
  delete: {
    roles: {
      owner: true,
    },
  },
  find: {
    base: {
      fromUserId: { $eq: { $ref: 'user._id' } },
    },
  },
  read: {
    base: ['_id', 'createdAt', 'fromUserId', 'toUserId', 'updatedAt'],
  },
  roles: [
    {
      name: 'owner',
      query: {
        'record.fromUserId': { $eq: { $ref: 'user._id' } },
      },
    },
  ],
  update: {
    roles: {
      owner: ['fromUserId', 'toUserId'],
    },
  },
});
