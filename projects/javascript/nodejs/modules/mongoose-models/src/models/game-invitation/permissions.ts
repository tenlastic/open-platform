import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GameInvitation, GameInvitationDocument } from './model';

export const GameInvitationPermissions = new MongoosePermissions<GameInvitationDocument>(
  GameInvitation,
  {
    create: {
      roles: {
        administrator: ['gameId', 'toUserId'],
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
            gameId: {
              $in: {
                // Find all Databases within the returned Namespaces.
                $query: {
                  model: 'GameSchema',
                  select: '_id',
                  where: {
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
    populate: [{ path: 'gameDocument', populate: { path: 'namespaceDocument' } }],
    read: {
      base: ['_id', 'createdAt', 'fromUserId', 'gameId', 'toUserId', 'updatedAt'],
    },
    roles: [
      {
        name: 'administrator',
        query: {
          'record.gameDocument.namespaceDocument.accessControlList': {
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
