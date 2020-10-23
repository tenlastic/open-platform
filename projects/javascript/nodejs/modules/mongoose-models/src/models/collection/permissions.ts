import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Collection, CollectionDocument } from './model';

export const CollectionPermissions = new MongoosePermissions<CollectionDocument>(Collection, {
  create: {
    roles: {
      'namespace-administrator': ['databaseId', 'jsonSchema.*', 'name', 'permissions.*'],
    },
  },
  delete: {
    roles: {
      'namespace-administrator': true,
    },
  },
  find: {
    base: {
      databaseId: {
        $in: {
          // Find all Databases within the returned Namespaces.
          $query: {
            model: 'DatabaseSchema',
            select: '_id',
            where: {
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
          },
        },
      },
    },
  },
  populate: [{ path: 'databaseDocument', populate: { path: 'namespaceDocument' } }],
  read: {
    base: [
      '_id',
      'createdAt',
      'databaseId',
      'indexes',
      'jsonSchema',
      'name',
      'permissions',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.databaseDocument.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'databases' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.databaseDocument.namespaceDocument.users': {
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
    roles: {
      'namespace-administrator': ['databaseId', 'indexes', 'jsonSchema.*', 'name', 'permissions.*'],
    },
  },
});
