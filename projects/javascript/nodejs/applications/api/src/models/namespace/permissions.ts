import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Namespace, NamespaceDocument } from './model';

export const NamespacePermissions = new MongoosePermissions<NamespaceDocument>(Namespace, {
  create: {
    roles: {
      'system-administrator': ['accessControlList', 'name'],
    },
  },
  delete: {
    base: false,
    roles: {
      administrator: true,
    },
  },
  find: {
    base: { 'accessControlList.userId': { $eq: { $ref: 'user._id' } } },
  },
  read: {
    base: ['_id', 'createdAt', 'accessControlList', 'name', 'updatedAt'],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'Administrator' },
      },
    },
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
