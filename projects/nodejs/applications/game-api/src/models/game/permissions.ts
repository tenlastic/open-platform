import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Game, GameDocument } from './model';

export const GamePermissions = new MongoosePermissions<GameDocument>(Game, {
  create: {
    base: ['accessControlList', 'name'],
  },
  delete: {
    base: false,
    roles: {
      administrator: true,
    },
  },
  find: {
    base: { 'accessControlList.userId': { $ref: 'user._id' } },
  },
  read: {
    base: ['_id', 'createdAt', 'accessControlList', 'name', 'updatedAt'],
  },
  roles: [
    {
      name: 'administrator',
      query: { 'record.accessControlList.userId': { $eq: { $ref: 'user._id' } } },
    },
  ],
  update: {
    roles: {
      administrator: ['accessControlList', 'name'],
    },
  },
});
