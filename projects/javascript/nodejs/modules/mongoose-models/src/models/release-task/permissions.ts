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
          // Find all Releases within the returned Game.
          $query: {
            model: 'ReleaseSchema',
            select: '_id',
            where: {
              gameId: {
                $in: {
                  // Find all Games within the returned Namespaces.
                  $query: {
                    model: 'GameSchema',
                    select: '_id',
                    where: {
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
        'record.releaseDocument.gameDocument.namespaceDocument.accessControlList': {
          $elemMatch: {
            roles: { $eq: 'Administrator' },
            userId: { $eq: { $ref: 'user._id' } },
          },
        },
      },
    },
  ],
});
