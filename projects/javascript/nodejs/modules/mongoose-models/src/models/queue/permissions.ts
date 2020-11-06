import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Queue, QueueDocument } from './model';

export const QueuePermissions = new MongoosePermissions<QueueDocument>(Queue, {
  create: {
    roles: {
      'namespace-administrator': [
        '_id',
        'createdAt',
        'description',
        'gameServerTemplate.*',
        'name',
        'namespaceId',
        'usersPerTeam',
        'teams',
        'updatedAt',
      ],
      'system-administrator': [
        '_id',
        'createdAt',
        'description',
        'gameServerTemplate.*',
        'name',
        'namespaceId',
        'usersPerTeam',
        'teams',
        'updatedAt',
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
    roles: {
      'system-administrator': {},
    },
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    base: [
      '_id',
      'createdAt',
      'description',
      'gameServerTemplate.*',
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
    roles: {
      'namespace-administrator': [
        '_id',
        'createdAt',
        'description',
        'gameServerTemplate.*',
        'name',
        'namespaceId',
        'usersPerTeam',
        'teams',
        'updatedAt',
      ],
      'system-administrator': [
        '_id',
        'createdAt',
        'description',
        'gameServerTemplate.*',
        'name',
        'namespaceId',
        'usersPerTeam',
        'teams',
        'updatedAt',
      ],
    },
  },
});
