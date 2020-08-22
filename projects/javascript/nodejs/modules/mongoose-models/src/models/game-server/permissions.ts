import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GameServer, GameServerDocument } from './model';

export const GameServerPermissions = new MongoosePermissions<GameServerDocument>(GameServer, {
  create: {
    roles: {
      'namespace-administrator': [
        'allowedUserIds',
        'currentUserIds',
        'description',
        'gameId',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'releaseId',
        'status',
      ],
      'system-administrator': [
        'allowedUserIds',
        'currentUserIds',
        'description',
        'gameId',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'releaseId',
        'status',
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
      'isPersistent',
      'isPreemptible',
      'metadata.*',
      'name',
      'port',
      'queueId',
      'releaseId',
      'status',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: { 'user.roles': { $eq: 'Administrator' } },
    },
    {
      name: 'namespace-administrator',
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
      'namespace-administrator': [
        'allowedUserIds',
        'currentUserIds',
        'description',
        'gameId',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'releaseId',
        'status',
      ],
      'system-administrator': [
        'allowedUserIds',
        'currentUserIds',
        'description',
        'gameId',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'releaseId',
        'status',
      ],
    },
  },
});
