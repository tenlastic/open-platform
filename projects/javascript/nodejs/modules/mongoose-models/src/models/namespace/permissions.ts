import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Namespace, NamespaceDocument } from './model';

export const NamespacePermissions = new MongoosePermissions<NamespaceDocument>(Namespace, {
  create: {
    'system-administrator': ['keys', 'limits.*', 'name', 'users'],
  },
  delete: {
    default: false,
    'system-administrator': true,
  },
  find: {
    default: {
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
    'system-administrator': {},
  },
  read: {
    default: ['_id', 'createdAt', 'name', 'updatedAt'],
    'namespace-administrator': [
      '_id',
      'createdAt',
      'keys',
      'limits.*',
      'name',
      'updatedAt',
      'users',
    ],
    'system-administrator': ['_id', 'createdAt', 'keys', 'limits.*', 'name', 'updatedAt', 'users'],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'namespaces' },
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
    'namespace-administrator': ['keys', 'name', 'users'],
    'system-administrator': ['keys', 'limits.*', 'name', 'users'],
  },
});
