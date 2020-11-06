import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Log, LogDocument } from './model';

export const LogPermissions = new MongoosePermissions<LogDocument>(Log, {
  create: {
    roles: {
      'namespace-administrator': ['body', 'gameServerId', 'unix'],
      'system-administrator': ['body', 'gameServerId', 'unix'],
    },
  },
  find: {
    base: {
      gameServerId: {
        $in: {
          // Find Game Servers within returned Namespaces.
          $query: {
            model: 'GameServerSchema',
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
      path: 'gameServerDocument',
      populate: {
        path: 'namespaceDocument',
      },
    },
  ],
  read: {
    base: ['_id', 'body', 'createdAt', 'gameServerId', 'unix', 'updatedAt'],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'game-servers' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.gameServerDocument.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'game-servers' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.gameServerDocument.namespaceDocument.users': {
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
});
