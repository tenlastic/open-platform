import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Namespace, NamespaceDocument, NamespaceRole } from './model';

export const NamespacePermissions = new MongoosePermissions<NamespaceDocument>(Namespace, {
  create: {
    'user-administrator': ['keys.*', 'limits.*', 'name', 'users.*'],
  },
  delete: {
    default: false,
    'user-administrator': true,
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
    'user-administrator': {},
  },
  read: {
    default: ['_id', 'createdAt', 'name', 'updatedAt'],
    'namespace-administrator': [
      '_id',
      'createdAt',
      'keys.*',
      'limits.*',
      'name',
      'updatedAt',
      'users.*',
    ],
    'user-administrator': [
      '_id',
      'createdAt',
      'keys.*',
      'limits.*',
      'name',
      'updatedAt',
      'users.*',
    ],
  },
  roles: [
    {
      name: 'user-administrator',
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
    'namespace-administrator': ['keys.*', 'name', 'users.*'],
    'user-administrator': ['keys.*', 'limits.*', 'name', 'users.*'],
  },
});

export const NamespacePermissionsHelpers = {
  getNamespaceIdsByRole(role: NamespaceRole) {
    return {
      $query: {
        model: 'NamespaceSchema',
        select: '_id',
        where: {
          $or: [
            { keys: { $elemMatch: { roles: role, value: { $ref: 'key' } } } },
            { users: { $elemMatch: { _id: { $ref: 'user._id' }, roles: role } } },
          ],
        },
      },
    };
  },
  getRoleQuery(namespaceDocumentPath: string, role: NamespaceRole) {
    return {
      $or: [
        {
          [`${namespaceDocumentPath}.keys`]: {
            $elemMatch: { roles: role, value: { $ref: 'key' } },
          },
        },
        {
          [`${namespaceDocumentPath}.users`]: {
            $elemMatch: { _id: { $ref: 'user._id' }, roles: role },
          },
        },
      ],
    };
  },
};
