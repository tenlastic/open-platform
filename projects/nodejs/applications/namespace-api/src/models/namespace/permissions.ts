import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Namespace, NamespaceDocument } from './model';

export const NamespacePermissions = new MongoosePermissions<NamespaceDocument>(Namespace, {
  create: {
    roles: {
      admin: ['accessControlList', 'name'],
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
    base: ['_id', 'createdAt', 'accessControlList', 'name', 'updatedAt'],
  },
  roles: [{ name: 'admin', query: { 'user.roles': { $eq: 'Admin' } } }],
  update: {
    roles: {
      admin: ['accessControlList', 'name'],
    },
  },
});
