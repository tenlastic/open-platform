import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Collection, CollectionDocument } from './model';

export const CollectionPermissions = new MongoosePermissions<CollectionDocument>(Collection, {
  create: {
    roles: {
      'namespace-administrator': ['jsonSchema.*', 'name', 'namespaceId', 'permissions.*'],
      'system-administrator': ['jsonSchema.*', 'name', 'namespaceId', 'permissions.*'],
    },
  },
  delete: {
    roles: {
      'namespace-administrator': true,
      'system-administrator': true,
    },
  },
  find: {
    base: {
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
                      roles: { $eq: 'collections' },
                      value: { $eq: { $ref: 'key' } },
                    },
                  },
                },
                {
                  users: {
                    $elemMatch: {
                      _id: { $eq: { $ref: 'user._id' } },
                      roles: { $eq: 'collections' },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    roles: {
      'system-administrator': {},
    },
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    base: [
      '_id',
      'createdAt',
      'indexes',
      'jsonSchema.*',
      'name',
      'namespaceId',
      'permissions.*',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'collections' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'collections' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'collections' },
              },
            },
          },
        ],
      },
    },
  ],
  update: {
    roles: {
      'namespace-administrator': [
        'indexes',
        'jsonSchema.*',
        'name',
        'namespaceId',
        'permissions.*',
      ],
      'system-administrator': ['indexes', 'jsonSchema.*', 'name', 'namespaceId', 'permissions.*'],
    },
  },
});
