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
      'system-administrator': true,
    },
  },
  find: {
    base: { 'accessControlList.userId': { $eq: { $ref: 'user._id' } } },
  },
  read: {
    base: ['_id', 'createdAt', 'name', 'updatedAt'],
    roles: {
      administrator: ['accessControlList'],
      'system-administrator': ['accessControlList'],
    },
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
      'system-administrator': ['accessControlList', 'name'],
    },
  },
});
