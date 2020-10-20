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
              // Find all Namespaces that the user is a member of.
              $query: {
                model: 'NamespaceSchema',
                select: '_id',
                where: {
                  'accessControlList.userId': { $eq: { $ref: 'user._id' } },
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
      'namespace-administrator': ['entrypoint', 'namespaceId', 'publishedAt', 'version'],
      'system-administrator': ['entrypoint', 'namespaceId', 'publishedAt', 'version'],
    },
  },
});
