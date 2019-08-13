import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Collection, CollectionDocument } from './model';

export const CollectionPermissions = new MongoosePermissions<CollectionDocument>(Collection, {
  create: {
    roles: {
      admin: ['databaseId', 'jsonSchema', 'name'],
    },
  },
  delete: {
    roles: {
      admin: true,
      owner: true,
    },
  },
  find: {},
  populate: { path: 'databaseDocument' },
  read: {
    base: ['_id', 'createdAt', 'databaseId', 'indexes', 'jsonSchema', 'name', 'updatedAt'],
  },
  roles: [
    {
      name: 'admin',
      query: { 'user.roles': { $eq: 'Admin' } },
    },
    {
      name: 'owner',
      query: { 'record.databaseDocument.userId': { $eq: 'user._id' } },
    },
  ],
  update: {
    roles: {
      admin: ['databaseId', 'indexes', 'jsonSchema', 'name'],
      owner: ['databaseId', 'indexes', 'jsonSchema', 'name'],
    },
  },
});
