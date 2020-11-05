import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Build, BuildDocument } from './model';

export const BuildPermissions = new MongoosePermissions<BuildDocument>(Build, {
  create: {
    roles: {
      'namespace-administrator': ['entrypoints.*', 'namespaceId', 'publishedAt', 'version'],
      'system-administrator': ['entrypoints.*', 'namespaceId', 'publishedAt', 'version'],
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
      $or: [
        { $and: [{ publishedAt: { $exists: true } }, { publishedAt: { $ne: null } }] },
        {
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
                          roles: { $eq: 'builds' },
                          value: { $eq: { $ref: 'key' } },
                        },
                      },
                    },
                    {
                      users: {
                        $elemMatch: {
                          _id: { $eq: { $ref: 'user._id' } },
                          roles: { $eq: 'builds' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
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
      'entrypoints.*',
      'namespaceId',
      'publishedAt',
      'version',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'Administrator' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'builds' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'builds' },
              },
            },
          },
        ],
      },
    },
  ],
  update: {
    roles: {
      'namespace-administrator': ['entrypoints.*', 'namespaceId', 'publishedAt', 'version'],
      'system-administrator': ['entrypoints.*', 'namespaceId', 'publishedAt', 'version'],
    },
  },
});
