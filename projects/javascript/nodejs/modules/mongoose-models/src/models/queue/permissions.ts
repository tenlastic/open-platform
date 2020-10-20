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
          namespaceId: {
            $in: {
              // Find all Namespaces of which the User has been invited.
              $query: {
                model: 'GameInvitationSchema',
                select: 'namespaceId',
                where: {
                  toUserId: { $eq: { $ref: 'user._id' } },
                },
              },
            },
          },
        },
        {
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
      ],
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
      name: 'namespace-administrator',
      query: {
        'record.namespaceDocument.accessControlList': {
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
