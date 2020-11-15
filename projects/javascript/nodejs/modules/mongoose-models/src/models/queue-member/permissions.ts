import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { QueueMember, QueueMemberDocument } from './model';

export const QueueMemberPermissions = new MongoosePermissions<QueueMemberDocument>(QueueMember, {
  create: {
    'namespace-administrator': ['queueId', 'userId'],
    owner: ['queueId', 'userId'],
    'system-administrator': ['queueId', 'userId'],
  },
  delete: {
    'namespace-administrator': true,
    owner: true,
    'system-administrator': true,
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
      ],
    },
    'system-administrator': {},
  },
  populate: [
    {
      path: 'gameInvitationDocuments',
    },
    {
      path: 'queueDocument',
      populate: [{ path: 'namespaceDocument' }],
    },
  ],
  read: {
    default: ['_id', 'createdAt', 'queueId', 'updatedAt', 'userId'],
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
      name: 'owner',
      query: {
        'record.gameInvitationDocuments.namespaceId': {
          $eq: { $ref: 'record.queueDocument.namespaceId' },
        },
        'record.userId': { $eq: { $ref: 'user._id' } },
      },
    },
  ],
});
