import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { File, FileDocument } from './model';

export const FilePermissions = new MongoosePermissions<FileDocument>(File, {
  create: {
    roles: {
      'namespace-administrator': [
        'compressedBytes',
        'md5',
        'path',
        'platform',
        'releaseId',
        'uncompressedBytes',
      ],
      'system-administrator': [
        'compressedBytes',
        'md5',
        'path',
        'platform',
        'releaseId',
        'uncompressedBytes',
      ],
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
        {
          releaseId: {
            $in: {
              // Find all published Releases.
              $query: {
                model: 'ReleaseSchema',
                select: '_id',
                where: {
                  $and: [{ publishedAt: { $exists: true } }, { publishedAt: { $ne: null } }],
                },
              },
            },
          },
        },
        {
          releaseId: {
            $in: {
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
                                  'accessControlList.userId': { $eq: { $ref: 'user._id' } },
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
    base: [
      '_id',
      'compressedBytes',
      'createdAt',
      'md5',
      'path',
      'platform',
      'releaseId',
      'uncompressedBytes',
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
      'namespace-administrator': [
        'compressedBytes',
        'md5',
        'path',
        'platform',
        'releaseId',
        'uncompressedBytes',
      ],
      'system-administrator': [
        'compressedBytes',
        'md5',
        'path',
        'platform',
        'releaseId',
        'uncompressedBytes',
      ],
    },
  },
});
