import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GameInvitation, GameInvitationDocument } from './model';

export const GameInvitationPermissions = new MongoosePermissions<GameInvitationDocument>(
  GameInvitation,
  {
    create: {
      'namespace-administrator': ['namespaceId', 'userId'],
      'system-administrator': ['namespaceId', 'userId'],
    },
    delete: {
      'namespace-administrator': true,
      recipient: true,
      'system-administrator': true,
    },
    find: {
      default: {
        $or: [
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
                            roles: { $eq: 'game-invitations' },
                            value: { $eq: { $ref: 'key' } },
                          },
                        },
                      },
                      {
                        users: {
                          $elemMatch: {
                            _id: { $eq: { $ref: 'user._id' } },
                            roles: { $eq: 'game-invitations' },
                          },
                        },
                      },
                    ],
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
      'system-administrator': {},
    },
    populate: [{ path: 'namespaceDocument' }],
    read: {
      default: ['_id', 'createdAt', 'namespaceId', 'userId', 'updatedAt'],
    },
    roles: [
      {
        name: 'system-administrator',
        query: {
          'user.roles': { $eq: 'game-invitations' },
        },
      },
      {
        name: 'namespace-administrator',
        query: {
          $or: [
            {
              'record.namespaceDocument.keys': {
                $elemMatch: {
                  roles: { $eq: 'game-invitations' },
                  value: { $eq: { $ref: 'key' } },
                },
              },
            },
            {
              'record.namespaceDocument.users': {
                $elemMatch: {
                  _id: { $eq: { $ref: 'user._id' } },
                  roles: { $eq: 'game-invitations' },
                },
              },
            },
          ],
        },
      },
      {
        name: 'recipient',
        query: {
          'record.userId': { $eq: { $ref: 'user._id' } },
        },
      },
    ],
  },
);
