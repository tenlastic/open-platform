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
    base: {},
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
        'record.databaseDocument.namespaceDocument.accessControlList.userId': {
          $eq: { $ref: 'user._id' },
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
