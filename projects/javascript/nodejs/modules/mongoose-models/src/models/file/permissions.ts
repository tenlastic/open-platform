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
              // Find all Releases within the returned Namespaces.
              $query: {
                model: 'ReleaseSchema',
                select: '_id',
                where: {
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
        path: 'namespaceDocument',
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
        $or: [
          {
            'record.releaseDocument.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'releases' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.releaseDocument.namespaceDocument.users': {
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
