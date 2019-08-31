import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Namespace, NamespaceDocument } from './model';

export const NamespacePermissions = new MongoosePermissions<NamespaceDocument>(Namespace, {
  create: {
    roles: {
      admin: ['name'],
    },
  },
  delete: {
    roles: {
      admin: true,
    },
  },
  find: {
    base: {},
  },
  read: {
    base: ['_id', 'createdAt', 'name', 'updatedAt'],
  },
  roles: [{ name: 'admin', query: { 'user.roles': { $eq: 'Admin' } } }],
  update: {
    roles: {
      admin: ['name'],
    },
  },
});
