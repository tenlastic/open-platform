import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Collection, CollectionDocument } from './model';

export const CollectionPermissions = new MongoosePermissions<CollectionDocument>(Collection, {
  create: {
    roles: {
      administrator: ['databaseId', 'jsonSchema.*', 'name', 'permissions.*'],
    },
  },
  delete: {
    roles: {
      administrator: true,
    },
  },
  find: {
    base: {
      databaseId: {
        $in: {
          // Find all Collections within the returned Databases.
          $query: {
            model: 'DatabaseSchema',
            select: '_id',
            where: {
              namespaceId: {
                $in: {
                  // Find all Databases that the user is a member of.
                  $query: {
                    model: 'ReadonlyNamespaceSchema',
                    select: '_id',
                    where: {
                      'accessControlList.userId': { $ref: 'user._id' },
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
      name: 'administrator',
      query: {
        'record.databaseDocument.namespaceDocument.accessControlList': {
          $elemMatch: {
            roles: { $eq: 'Administrator' },
            userId: { $eq: { $ref: 'user._id' } },
          },
        },
      },
    },
  ],
  update: {
    roles: {
      administrator: ['databaseId', 'indexes', 'jsonSchema.*', 'name', 'permissions.*'],
    },
  },
});
