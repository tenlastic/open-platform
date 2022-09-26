import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Ignoration, IgnorationDocument } from '../models';

export const IgnorationPermissions = new MongoosePermissions<IgnorationDocument>(Ignoration, {
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
  roles: [
    {
      name: 'owner',
      query: { 'record.fromUserId': { $ref: 'user._id' } },
    },
  ],
});
