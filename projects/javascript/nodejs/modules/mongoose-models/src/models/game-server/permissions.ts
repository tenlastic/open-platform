import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GameServer, GameServerDocument } from './model';

export const GameServerPermissions = new MongoosePermissions<GameServerDocument>(GameServer, {
  create: {
    roles: {
      administrator: [
        'description',
        'gameId',
        'heartbeatAt',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
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
      'createdAt',
      'currentUserIds',
      'description',
      'gameId',
      'heartbeatAt',
      'isPersistent',
      'isPreemptible',
      'metadata',
      'name',
      'port',
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
        'currentUserIds',
        'description',
        'gameId',
        'heartbeatAt',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'releaseId',
      ],
    },
  },
});