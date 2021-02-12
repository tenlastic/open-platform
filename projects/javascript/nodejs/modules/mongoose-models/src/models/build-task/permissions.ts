import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { BuildTask, BuildTaskDocument } from './model';

export const BuildTaskPermissions = new MongoosePermissions<BuildTaskDocument>(BuildTask, {
  delete: {
    'namespace-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: {
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
    'user-administrator': {},
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
    default: [
      '_id',
      'action',
      'buildId',
      'completedAt',
      'createdAt',
      'failedAt',
      'metadata',
      'platform',
      'startedAt',
      'status',
      'updatedAt',
    ],
  },
  roles: [
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
});
