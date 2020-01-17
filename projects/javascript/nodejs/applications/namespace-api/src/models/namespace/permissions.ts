import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Namespace, NamespaceDocument } from './model';

export const NamespacePermissions = new MongoosePermissions<NamespaceDocument>(Namespace, {
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
