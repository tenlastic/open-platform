import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Database, DatabaseDocument } from './model';

export const DatabasePermissions = new MongoosePermissions<DatabaseDocument>(Database, {
  create: {
    roles: {
      admin: ['name', 'userId'],
    },
  },
  delete: {
    roles: {
      admin: true,
    },
  },
  find: {
    roles: {
      default: {
        userId: { $ref: 'user._id' },
      },
    },
  },
  read: {
    base: ['_id', 'createdAt', 'name', 'updatedAt', 'userId'],
  },
  roles: [{ name: 'admin', query: { 'user.roles': { $eq: 'Admin' } } }],
  update: {
    roles: {
      admin: ['name', 'userId'],
    },
  },
});
