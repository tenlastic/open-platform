import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Build, BuildDocument } from './model';

export const BuildPermissions = new MongoosePermissions<BuildDocument>(Build, {
  create: {
    'namespace-administrator': [
      'entrypoint',
      'namespaceId',
      'platform',
      'publishedAt',
      'reference.*',
      'version',
    ],
    'user-administrator': [
      'entrypoint',
      'namespaceId',
      'platform',
      'publishedAt',
      'reference.*',
      'version',
    ],
  },
  delete: {
    'namespace-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: {
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
    'system-administrator': {},
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'createdAt',
      'entrypoint',
      'files.*',
      'namespaceId',
      'platform',
      'publishedAt',
      'reference.*',
      'status.*',
      'version',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'builds' },
        'user.system': { $eq: true },
      },
    },
    {
      name: 'user-administrator',
      query: {
        'user.roles': { $eq: 'builds' },
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
    'namespace-administrator': ['entrypoint', 'publishedAt', 'version'],
    'system-administrator': ['files.*', 'status.*'],
    'user-administrator': ['entrypoint', 'publishedAt', 'version'],
  },
});
