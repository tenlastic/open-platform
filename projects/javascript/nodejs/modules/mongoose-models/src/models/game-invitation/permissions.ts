import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GameInvitation, GameInvitationDocument } from './model';

export const GameInvitationPermissions = new MongoosePermissions<GameInvitationDocument>(
  GameInvitation,
  {
    create: {
      roles: {
        administrator: ['namespaceId', 'toUserId'],
      },
    },
    delete: {
      roles: {
        administrator: true,
        recipient: true,
      },
    },
    find: {
      base: {
        $or: [
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
          {
            toUserId: { $eq: { $ref: 'user._id' } },
          },
        ],
      },
    },
    populate: [{ path: 'namespaceDocument' }],
    read: {
      base: ['_id', 'createdAt', 'fromUserId', 'namespaceId', 'toUserId', 'updatedAt'],
    },
    roles: [
      {
        name: 'administrator',
        query: {
          'record.namespaceDocument.accessControlList': {
            $elemMatch: {
              roles: { $eq: 'Administrator' },
              userId: { $eq: { $ref: 'user._id' } },
            },
          },
        },
      },
      {
        name: 'sender',
        query: {
          'record.fromUserId': { $eq: { $ref: 'user._id' } },
        },
      },
      {
        name: 'recipient',
        query: {
          'record.toUserId': { $eq: { $ref: 'user._id' } },
        },
      },
    ],
  },
);
