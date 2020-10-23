import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { ReleaseTask, ReleaseTaskDocument } from './model';

export const ReleaseTaskPermissions = new MongoosePermissions<ReleaseTaskDocument>(ReleaseTask, {
  delete: {
    roles: {
      'namespace-administrator': true,
      'system-administrator': true,
    },
  },
  find: {
    base: {
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
      'action',
      'completedAt',
      'createdAt',
      'failedAt',
      'metadata',
      'platform',
      'releaseId',
      'startedAt',
      'status',
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
});
