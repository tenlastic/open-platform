import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GameServer, GameServerDocument } from './model';

export const GameServerPermissions = new MongoosePermissions<GameServerDocument>(GameServer, {
  create: {
    roles: {
      'namespace-administrator': [
        'allowedUserIds',
        'currentUserIds',
        'description',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'namespaceId',
        'releaseId',
        'status',
      ],
      'system-administrator': [
        'allowedUserIds',
        'currentUserIds',
        'description',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'namespaceId',
        'releaseId',
        'status',
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
          namespaceId: {
            $in: {
              // Find all Namespaces of which the User has been invited.
              $query: {
                model: 'GameInvitationSchema',
                select: 'namespaceId',
                where: {
                  userId: { $eq: { $ref: 'user._id' } },
                },
              },
            },
          },
        },
        {
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
                          roles: { $eq: 'game-servers' },
                          value: { $eq: { $ref: 'key' } },
                        },
                      },
                    },
                    {
                      users: {
                        $elemMatch: {
                          _id: { $eq: { $ref: 'user._id' } },
                          roles: { $eq: 'game-servers' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    },
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    base: [
      '_id',
      'allowedUserIds',
      'createdAt',
      'currentUserIds',
      'description',
      'isPersistent',
      'isPreemptible',
      'metadata.*',
      'name',
      'namespaceId',
      'port',
      'queueId',
      'releaseId',
      'status',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: { 'user.roles': { $eq: 'Administrator' } },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'game-servers' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'game-servers' },
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
        'allowedUserIds',
        'currentUserIds',
        'description',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'namespaceId',
        'releaseId',
        'status',
      ],
      'system-administrator': [
        'allowedUserIds',
        'currentUserIds',
        'description',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'namespaceId',
        'releaseId',
        'status',
      ],
    },
  },
});
