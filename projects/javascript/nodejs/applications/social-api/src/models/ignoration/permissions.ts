import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Ignoration, IgnorationDocument } from './model';

export const IgnorationPermissions = new MongoosePermissions<IgnorationDocument>(Ignoration, {
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
