import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { File, FileDocument } from './model';

export const FilePermissions = new MongoosePermissions<FileDocument>(File, {
  create: {
    roles: {
      'namespace-administrator': ['path', 'platform', 'releaseId', 'url'],
      'system-administrator': ['path', 'platform', 'releaseId', 'url'],
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
          releaseId: {
            // Find all Releases within the returned Game.
            $query: {
              model: 'ReleaseSchema',
              select: '_id',
              where: {
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
            },
          },
        },
      ],
    },
    roles: {
      'system-administrator': {},
    },
  },
  populate: [
    {
      path: 'releaseDocument',
      populate: {
        path: 'gameDocument',
        populate: {
          path: 'namespaceDocument',
        },
      },
    },
  ],
  read: {
    base: ['_id', 'createdAt', 'path', 'platform', 'releaseId', 'url', 'updatedAt'],
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
        'record.releaseDocument.gameDocument.namespaceDocument.accessControlList': {
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
      'namespace-administrator': ['path', 'platform', 'releaseId', 'url'],
      'system-administrator': ['path', 'platform', 'releaseId', 'url'],
    },
  },
});
