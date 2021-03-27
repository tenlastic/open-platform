import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GameServer, GameServerDocument } from './model';

const administrator = {
  create: [
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
    'queueId',
  ],
  read: [
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
    'queueId',
    'status.*',
    'updatedAt',
  ],
  update: [
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
};

export const GameServerPermissions = new MongoosePermissions<GameServerDocument>(GameServer, {
  create: {
    'namespace-administrator': administrator.create,
    'system-administrator': administrator.create,
    'user-administrator': administrator.create,
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
      'createdAt',
      'currentUserIds',
      'description',
      'endpoints.*',
      'gameId',
      'isPersistent',
      'metadata.*',
      'name',
      'namespaceId',
      'queueId',
      'status.phase',
      'updatedAt',
    ],
    'namespace-administrator': administrator.read,
    'system-administrator': administrator.read,
    'user-administrator': administrator.read,
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
    'namespace-administrator': administrator.update,
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
      'status.*',
    ],
    'user-administrator': administrator.update,
  },
});
