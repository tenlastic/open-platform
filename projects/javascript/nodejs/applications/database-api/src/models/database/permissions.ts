import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Database, DatabaseDocument } from './model';

export const DatabasePermissions = new MongoosePermissions<DatabaseDocument>(Database, {
  create: {
    roles: {
      administrator: ['name', 'namespaceId'],
    },
  },
  delete: {
    roles: {
      administrator: true,
    },
  },
  find: {
    base: {
      namespaceId: {
        $in: {
          $query: {
            model: 'ReadonlyNamespaceSchema',
            select: '_id',
            where: {
              'accessControlList.userId': { $eq: { $ref: 'user._id' } },
            },
          },
        },
      },
    },
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    base: ['_id', 'createdAt', 'name', 'namespaceId', 'updatedAt'],
  },
  roles: [
    {
      name: 'administrator',
      query: {
        'record.namespaceDocument.accessControlList': {
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
      administrator: ['name', 'namespace'],
    },
  },
});
