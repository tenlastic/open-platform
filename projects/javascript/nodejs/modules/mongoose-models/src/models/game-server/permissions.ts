import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GameServer, GameServerDocument } from './model';

export const GameServerPermissions = new MongoosePermissions<GameServerDocument>(GameServer, {
  create: {
    'namespace-administrator': [
      'authorizedUserIds',
      'buildId',
      'cpu',
      'currentUserIds',
      'description',
      'gameId',
      'isPersistent',
      'isPreemptible',
      'memory',
      'metadata.*',
      'name',
      'namespaceId',
    ],
    'system-administrator': [
      'authorizedUserIds',
      'buildId',
      'cpu',
      'currentUserIds',
      'description',
      'endpoints.*',
      'gameId',
      'isPersistent',
      'isPreemptible',
      'memory',
      'metadata.*',
      'name',
      'namespaceId',
      'queueId',
      'status',
    ],
    'user-administrator': [
      'authorizedUserIds',
      'buildId',
      'cpu',
      'currentUserIds',
      'description',
      'gameId',
      'isPersistent',
      'isPreemptible',
      'memory',
      'metadata.*',
      'name',
      'namespaceId',
    ],
  },
  delete: {
    'namespace-administrator': true,
    'system-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: {
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
    'system-administrator': {},
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'authorizedUserIds',
      'buildId',
      'cpu',
      'createdAt',
      'currentUserIds',
      'description',
      'endpoints.*',
      'gameId',
      'isPersistent',
      'isPreemptible',
      'memory',
      'metadata.*',
      'name',
      'namespaceId',
      'port',
      'queueId',
      'status',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'game-servers' },
        'user.system': { $eq: true },
      },
    },
    {
      name: 'user-administrator',
      query: { 'user.roles': { $eq: 'game-servers' } },
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
    'namespace-administrator': [
      'authorizedUserIds',
      'buildId',
      'cpu',
      'currentUserIds',
      'description',
      'gameId',
      'isPersistent',
      'isPreemptible',
      'memory',
      'metadata.*',
      'name',
    ],
    'system-administrator': [
      'authorizedUserIds',
      'buildId',
      'cpu',
      'currentUserIds',
      'description',
      'endpoints.*',
      'gameId',
      'isPersistent',
      'isPreemptible',
      'memory',
      'metadata.*',
      'name',
      'queueId',
      'status',
    ],
    'user-administrator': [
      'authorizedUserIds',
      'buildId',
      'cpu',
      'currentUserIds',
      'description',
      'gameId',
      'isPersistent',
      'isPreemptible',
      'memory',
      'metadata.*',
      'name',
    ],
  },
});
