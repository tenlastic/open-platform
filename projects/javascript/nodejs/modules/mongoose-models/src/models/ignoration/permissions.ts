import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Ignoration, IgnorationDocument } from './model';

export const IgnorationPermissions = new MongoosePermissions<IgnorationDocument>(Ignoration, {
  create: {
    owner: ['fromUserId', 'toUserId'],
  },
  delete: {
    owner: true,
  },
  find: {
    default: { fromUserId: { $eq: { $ref: 'user._id' } } },
  },
  read: {
    default: ['_id', 'createdAt', 'fromUserId', 'toUserId', 'updatedAt'],
  },
  roles: [
    {
      name: 'owner',
      query: {
        'record.fromUserId': { $eq: { $ref: 'user._id' } },
      },
    },
  ],
});
