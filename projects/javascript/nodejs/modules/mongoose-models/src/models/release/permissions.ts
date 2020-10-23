import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Release, ReleaseDocument } from './model';

export const ReleasePermissions = new MongoosePermissions<ReleaseDocument>(Release, {
  create: {
    roles: {
      'namespace-administrator': ['entrypoint', 'namespaceId', 'publishedAt', 'version'],
      'system-administrator': ['entrypoint', 'namespaceId', 'publishedAt', 'version'],
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
                          roles: { $eq: 'releases' },
                          value: { $eq: { $ref: 'key' } },
                        },
                      },
                    },
                    {
                      users: {
                        $elemMatch: {
                          _id: { $eq: { $ref: 'user._id' } },
                          roles: { $eq: 'releases' },
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
    base: ['_id', 'createdAt', 'entrypoint', 'namespaceId', 'publishedAt', 'version', 'updatedAt'],
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
                roles: { $eq: 'releases' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'releases' },
              },
            },
          },
        ],
      },
    },
  ],
  update: {
    roles: {
      'namespace-administrator': ['entrypoint', 'namespaceId', 'publishedAt', 'version'],
      'system-administrator': ['entrypoint', 'namespaceId', 'publishedAt', 'version'],
    },
  },
});
