import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { QueueMember, QueueMemberDocument } from './model';

export const QueueMemberPermissions = new MongoosePermissions<QueueMemberDocument>(QueueMember, {
  create: {
    roles: {
      'invited-user': ['queueId', 'userId'],
      'namespace-administrator': ['queueId', 'userId'],
    },
  },
  delete: {
    roles: {
      'invited-user': true,
      'namespace-administrator': true,
    },
  },
  find: {
    base: {
      $or: [
        {
          queueId: {
            $in: {
              // Find all Queues within the returned Game.
              $query: {
                model: 'QueueSchema',
                select: '_id',
                where: {
                  gameId: {
                    $in: {
                      // Find all Databases within the returned Namespaces.
                      $query: {
                        model: 'GameSchema',
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
              },
            },
          },
        },
        {
          userId: { $eq: { $ref: 'user._id' } },
        },
      ],
    },
  },
  populate: [
    {
      path: 'queueDocument',
      populate: [
        { path: 'gameDocument', populate: { path: 'namespaceDocument' } },
        { path: 'gameInvitationDocument' },
      ],
    },
  ],
  read: {
    base: ['_id', 'createdAt', 'queueId', 'updatedAt', 'userId'],
  },
  roles: [
    {
      name: 'namespace-administrator',
      query: {
        'record.queueDocument.gameDocument.namespaceDocument.accessControlList': {
          $elemMatch: {
            roles: { $eq: 'Administrator' },
            userId: { $eq: { $ref: 'user._id' } },
          },
        },
      },
    },
    {
      name: 'invited-user',
      query: {
        'record.queueDocument.gameInvitationDocument': { $exists: true },
        'record.userId': { $eq: { $ref: 'user._id' } },
      },
    },
  ],
});
