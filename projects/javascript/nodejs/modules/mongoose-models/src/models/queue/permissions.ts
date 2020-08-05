import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Queue, QueueDocument } from './model';

export const QueuePermissions = new MongoosePermissions<QueueDocument>(Queue, {
  create: {
    roles: {
      'namespace-administrator': [
        '_id',
        'createdAt',
        'description',
        'gameId',
        'metadata.*',
        'name',
        'playersPerTeam',
        'teams',
        'updatedAt',
      ],
    },
  },
  delete: {
    roles: {
      'namespace-administrator': true,
    },
  },
  find: {
    base: {
      $or: [
        {
          gameId: {
            $in: {
              // Find all Games of which the User has been invited.
              $query: {
                model: 'GameInvitationSchema',
                select: 'gameId',
                where: {
                  toUserId: { $eq: { $ref: 'user._id' } },
                },
              },
            },
          },
        },
        {
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
      ],
    },
  },
  populate: [{ path: 'gameDocument', populate: { path: 'namespaceDocument' } }],
  read: {
    base: [
      '_id',
      'createdAt',
      'description',
      'gameId',
      'metadata',
      'name',
      'playersPerTeam',
      'teams',
      'updatedAt',
    ],
  },
  roles: [
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
      'namespace-administrator': [
        '_id',
        'createdAt',
        'description',
        'gameId',
        'metadata.*',
        'name',
        'playersPerTeam',
        'teams',
        'updatedAt',
      ],
    },
  },
});
