import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GameServer, GameServerDocument } from './model';

export const GameServerPermissions = new MongoosePermissions<GameServerDocument>(GameServer, {
  create: {
    roles: {
      administrator: [
        'allowedUserIds',
        'description',
        'gameId',
        'maxUsers',
        'metadata.*',
        'name',
        'password',
        'releaseId',
      ],
    },
  },
  delete: {
    roles: {
      administrator: true,
    },
  },
  find: {
    base: {},
  },
  populate: [
    {
      path: 'gameDocument',
      populate: { path: 'namespaceDocument' },
    },
  ],
  read: {
    base: [
      '_id',
      'allowedUserIds',
      'createdAt',
      'currentUserIds',
      'description',
      'gameId',
      'maxUsers',
      'metadata.*',
      'name',
      'password',
      'releaseId',
      'updatedAt',
    ],
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
  ],
  update: {
    roles: {
      administrator: [
        'allowedUserIds',
        'description',
        'gameId',
        'maxUsers',
        'metadata.*',
        'name',
        'password',
        'releaseId',
      ],
    },
  },
});
