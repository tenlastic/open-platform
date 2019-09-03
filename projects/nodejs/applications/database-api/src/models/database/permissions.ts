import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Database, DatabaseDocument } from './model';

export const DatabasePermissions = new MongoosePermissions<DatabaseDocument>(Database, {
  create: {
    base: ['name', 'namespaceId'],
  },
  delete: {
    roles: {
      administrator: true,
    },
  },
  find: {
    base: {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    base: ['_id', 'createdAt', 'name', 'namespaceId', 'updatedAt'],
  },
  roles: [
    {
      name: 'administrator',
      query: {
        'record.namespaceDocument.accessControlList.userId': { $eq: { $ref: 'user._id' } },
      },
    },
  ],
  update: {
    roles: {
      administrator: ['name', 'namespace'],
    },
  },
});
