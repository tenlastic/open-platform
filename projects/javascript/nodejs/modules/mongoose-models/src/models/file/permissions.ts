import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { File, FileDocument } from './model';

export const FilePermissions = new MongoosePermissions<FileDocument>(File, {
  create: {
    roles: {
      'namespace-administrator': [
        'buildId',
        'compressedBytes',
        'md5',
        'path',
        'platform',
        'uncompressedBytes',
      ],
      'system-administrator': [
        'buildId',
        'compressedBytes',
        'md5',
        'path',
        'platform',
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
          buildId: {
            $in: {
              // Find all published Builds.
              $query: {
                model: 'BuildSchema',
                select: '_id',
                where: {
                  $and: [{ publishedAt: { $exists: true } }, { publishedAt: { $ne: null } }],
                },
              },
            },
          },
        },
        {
          buildId: {
            $in: {
              // Find all Builds within the returned Namespaces.
              $query: {
                model: 'BuildSchema',
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
      path: 'buildDocument',
      populate: {
        path: 'namespaceDocument',
      },
    },
  ],
  read: {
    base: [
      '_id',
      'buildId',
      'compressedBytes',
      'createdAt',
      'md5',
      'path',
      'platform',
      'uncompressedBytes',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'builds' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.buildDocument.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'builds' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.buildDocument.namespaceDocument.users': {
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
      'namespace-administrator': [
        'buildId',
        'compressedBytes',
        'md5',
        'path',
        'platform',
        'uncompressedBytes',
      ],
      'system-administrator': [
        'buildId',
        'compressedBytes',
        'md5',
        'path',
        'platform',
        'uncompressedBytes',
      ],
    },
  },
});
