import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Release, ReleaseDocument } from './model';

export const ReleasePermissions = new MongoosePermissions<ReleaseDocument>(Release, {
  create: {
    roles: {
      'namespace-administrator': ['entrypoint', 'gameId', 'publishedAt', 'version'],
      'system-administrator': ['entrypoint', 'gameId', 'publishedAt', 'version'],
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
          gameId: {
            $in: {
              // Find all Games within the returned Namespaces.
              $query: {
                model: 'ReadonlyGameSchema',
                select: '_id',
                where: {
                  namespaceId: {
                    $in: {
                      // Find all Namespaces that the user is a member of.
                      $query: {
                        model: 'ReadonlyNamespaceSchema',
                        select: '_id',
                        where: {
                          'accessControlList.userId': { $ref: 'user._id' },
                        },
                      },
                    },
                  },
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
  populate: [{ path: 'gameDocument', populate: { path: 'namespaceDocument' } }],
  read: {
    base: ['_id', 'createdAt', 'entrypoint', 'gameId', 'publishedAt', 'version', 'updatedAt'],
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
        'record.gameDocument.namespaceDocument.accessControlList': {
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
      'namespace-administrator': ['entrypoint', 'gameId', 'publishedAt', 'version'],
      'system-administrator': ['entrypoint', 'gameId', 'publishedAt', 'version'],
    },
  },
});
