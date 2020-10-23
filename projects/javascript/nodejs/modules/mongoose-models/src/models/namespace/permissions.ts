import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Namespace, NamespaceDocument } from './model';

export const NamespacePermissions = new MongoosePermissions<NamespaceDocument>(Namespace, {
  create: {
    roles: {
      'system-administrator': ['keys', 'name', 'users'],
    },
  },
  delete: {
    base: false,
    roles: {
      'namespace-administrator': true,
      'system-administrator': true,
    },
  },
  find: {
    base: {
      $or: [
        {
          keys: {
            $elemMatch: {
              roles: { $eq: 'namespaces' },
              value: { $eq: { $ref: 'key' } },
            },
          },
        },
        {
          users: {
            $elemMatch: {
              _id: { $eq: { $ref: 'user._id' } },
              roles: { $eq: 'namespaces' },
            },
          },
        },
      ],
    },
    roles: {
      'system-administrator': {},
    },
  },
  read: {
    base: ['_id', 'createdAt', 'name', 'updatedAt'],
    roles: {
      'namespace-administrator': ['keys', 'users'],
      'system-administrator': ['keys', 'users'],
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
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.keys': {
              $elemMatch: {
                roles: { $eq: 'namespaces' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'namespaces' },
              },
            },
          },
        ],
      },
    },
  ],
  update: {
    roles: {
      'namespace-administrator': ['keys', 'name', 'users'],
      'system-administrator': ['keys', 'name', 'users'],
    },
  },
});
