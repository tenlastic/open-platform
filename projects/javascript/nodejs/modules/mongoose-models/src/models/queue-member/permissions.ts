import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { QueueMember, QueueMemberDocument } from './model';

export const QueueMemberPermissions = new MongoosePermissions<QueueMemberDocument>(QueueMember, {
  create: {
    'group-leader': ['groupId', 'queueId'],
    'namespace-administrator': ['groupId', 'queueId', 'userId'],
    owner: ['queueId', 'userId'],
    'user-administrator': ['groupId', 'queueId', 'userId'],
  },
  delete: {
    'group-leader': true,
    'namespace-administrator': true,
    owner: true,
    'system-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: {
      $or: [
        {
          queueId: {
            $in: {
              // Find all Queues within the returned Namespaces.
              $query: {
                model: 'QueueSchema',
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
              },
            },
          },
        },
        {
          queueId: {
            $in: {
              // Find all Queues within the returned Namespaces.
              $query: {
                model: 'QueueSchema',
                select: '_id',
                where: {
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
              },
            },
          },
        },
        {
          userIds: { $eq: { $ref: 'user._id' } },
        },
      ],
    },
    'system-administrator': {},
    'user-administrator': {},
  },
  populate: [
    { path: 'groupDocument' },
    {
      path: 'queueDocument',
      populate: [{ path: 'namespaceDocument' }],
    },
  ],
  read: {
    default: ['_id', 'createdAt', 'groupId', 'queueId', 'updatedAt', 'userId', 'userIds'],
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
            'record.queueDocument.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'queues' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.queueDocument.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'queues' },
              },
            },
          },
        ],
      },
    },
    {
      name: 'group-leader',
      query: {
        'record.groupDocument.userIds.0': { $eq: { $ref: 'user._id' } },
      },
    },
    {
      name: 'owner',
      query: {
        'record.userId': { $eq: { $ref: 'user._id' } },
      },
    },
  ],
});
