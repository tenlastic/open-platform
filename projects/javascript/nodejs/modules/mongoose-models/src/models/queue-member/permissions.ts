import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { QueueMember, QueueMemberDocument } from './model';

export const QueueMemberPermissions = new MongoosePermissions<QueueMemberDocument>(QueueMember, {
  create: {
    roles: {
      'namespace-administrator': ['queueId', 'userId'],
      owner: ['queueId', 'userId'],
    },
  },
  delete: {
    roles: {
      'namespace-administrator': true,
      owner: true,
    },
  },
  find: {
    base: {
      $or: [
        {
          queueId: {
            $in: {
              // Find all Queues within the returned Games.
              $query: {
                model: 'QueueSchema',
                select: '_id',
                where: {
                  namespaceId: {
                    $in: {
                      // Find all Namespaces that the User is a member of.
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
                          toUserId: { $eq: { $ref: 'user._id' } },
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
    base: ['_id', 'createdAt', 'queueId', 'updatedAt', 'userId'],
  },
  roles: [
    {
      name: 'namespace-administrator',
      query: {
        'record.queueDocument.namespaceDocument.accessControlList': {
          $elemMatch: {
            roles: { $eq: 'Administrator' },
            userId: { $eq: { $ref: 'user._id' } },
          },
        },
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
