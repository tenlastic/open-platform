import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Collection, CollectionDocument } from './model';

export const CollectionPermissions = new MongoosePermissions<CollectionDocument>(Collection, {
  create: {
    'namespace-administrator': [
      'databaseId',
      'indexes.*',
      'jsonSchema.*',
      'name',
      'namespaceId',
      'permissions.*',
    ],
    'user-administrator': [
      'databaseId',
      'indexes.*',
      'jsonSchema.*',
      'name',
      'namespaceId',
      'permissions.*',
    ],
  },
  delete: {
    'namespace-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: {
      namespaceId: {
        $in: {
          // Find Namespaces where the Key or User has administrator access.
          $query: {
            model: 'NamespaceSchema',
            select: '_id',
            where: {
              $or: [
                {
                  keys: {
                    $elemMatch: {
                      roles: { $eq: 'databases' },
                      value: { $eq: { $ref: 'key' } },
                    },
                  },
                },
                {
                  users: {
                    $elemMatch: {
                      _id: { $eq: { $ref: 'user._id' } },
                      roles: { $eq: 'databases' },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'createdAt',
      'databaseId',
      'indexes.*',
      'jsonSchema.*',
      'name',
      'namespaceId',
      'permissions.*',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'user-administrator',
      query: {
        'user.roles': { $eq: 'databases' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'databases' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'databases' },
              },
            },
          },
        ],
      },
    },
  ],
  update: {
    'namespace-administrator': ['databaseId', 'indexes.*', 'jsonSchema.*', 'name', 'permissions.*'],
    'user-administrator': ['databaseId', 'indexes.*', 'jsonSchema.*', 'name', 'permissions.*'],
  },
});
