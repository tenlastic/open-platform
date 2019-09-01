import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Collection, CollectionDocument } from './model';

export const CollectionPermissions = new MongoosePermissions<CollectionDocument>(Collection, {
  create: {
    roles: {
      admin: ['databaseId', 'jsonSchema.*', 'name', 'permissions.*'],
    },
  },
  delete: {
    roles: {
      admin: true,
    },
  },
  find: {
    base: {},
  },
  populate: { path: 'databaseDocument' },
  read: {
    base: [
      '_id',
      'createdAt',
      'databaseId',
      'indexes',
      'jsonSchema.*',
      'name',
      'permissions.*',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'admin',
      query: { 'user.roles': { $eq: 'Admin' } },
    },
  ],
  update: {
    roles: {
      admin: ['databaseId', 'indexes', 'jsonSchema.*', 'name', 'permissions.*'],
    },
  },
});
