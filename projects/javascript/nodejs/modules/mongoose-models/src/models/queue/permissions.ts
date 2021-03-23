import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Queue, QueueDocument } from './model';

export const QueuePermissions = new MongoosePermissions<QueueDocument>(Queue, {
  create: {
    'namespace-administrator': [
      '_id',
      'createdAt',
      'description',
      'gameId',
      'gameServerTemplate.*',
      'metadata.*',
      'name',
      'namespaceId',
      'usersPerTeam',
      'teams',
      'updatedAt',
    ],
    'user-administrator': [
      '_id',
      'createdAt',
      'description',
      'gameId',
      'gameServerTemplate.*',
      'metadata.*',
      'name',
      'namespaceId',
      'usersPerTeam',
      'teams',
      'updatedAt',
    ],
  },
  delete: {
    'namespace-administrator': true,
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
                          roles: { $eq: 'queues' },
                          value: { $eq: { $ref: 'key' } },
                        },
                      },
                    },
                    {
                      users: {
                        $elemMatch: {
                          _id: { $eq: { $ref: 'user._id' } },
                          roles: { $eq: 'queues' },
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
      'createdAt',
      'description',
      'gameId',
      'gameServerTemplate.*',
      'metadata.*',
      'name',
      'namespaceId',
      'usersPerTeam',
      'teams',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'queues' },
        'user.system': { $eq: true },
      },
    },
    {
      name: 'user-administrator',
      query: {
        'user.roles': { $eq: 'queues' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'queues' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'queues' },
              },
            },
          },
        ],
      },
    },
  ],
  update: {
    'namespace-administrator': [
      '_id',
      'createdAt',
      'description',
      'gameId',
      'gameServerTemplate.*',
      'metadata.*',
      'name',
      'usersPerTeam',
      'teams',
      'updatedAt',
    ],
    'user-administrator': [
      '_id',
      'createdAt',
      'description',
      'gameId',
      'gameServerTemplate.*',
      'metadata.*',
      'name',
      'usersPerTeam',
      'teams',
      'updatedAt',
    ],
  },
});
