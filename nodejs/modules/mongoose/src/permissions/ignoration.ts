import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { IgnorationDocument, IgnorationModel } from '../models';

export const IgnorationPermissions = new MongoosePermissions<IgnorationDocument>(IgnorationModel, {
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
