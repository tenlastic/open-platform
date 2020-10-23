import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Database, DatabaseDocument } from './model';

export const DatabasePermissions = new MongoosePermissions<DatabaseDocument>(Database, {
  create: {
    roles: {
      'namespace-administrator': ['name', 'namespaceId'],
    },
  },
  delete: {
    roles: {
      'namespace-administrator': true,
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
  populate: [{ path: 'namespaceDocument' }],
  read: {
    base: ['_id', 'createdAt', 'name', 'namespaceId', 'updatedAt'],
  },
  roles: [
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
    roles: {
      'namespace-administrator': ['name', 'namespace'],
    },
  },
});
