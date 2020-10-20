import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GameServer, GameServerDocument } from './model';

export const GameServerPermissions = new MongoosePermissions<GameServerDocument>(GameServer, {
  create: {
    roles: {
      'namespace-administrator': [
        'allowedUserIds',
        'currentUserIds',
        'description',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'namespaceId',
        'releaseId',
        'status',
      ],
      'system-administrator': [
        'allowedUserIds',
        'currentUserIds',
        'description',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'namespaceId',
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
  populate: [{ path: 'namespaceDocument' }],
  read: {
    base: [
      '_id',
      'allowedUserIds',
      'createdAt',
      'currentUserIds',
      'description',
      'isPersistent',
      'isPreemptible',
      'metadata.*',
      'name',
      'namespaceId',
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
        'record.namespaceDocument.accessControlList': {
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
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'namespaceId',
        'releaseId',
        'status',
      ],
      'system-administrator': [
        'allowedUserIds',
        'currentUserIds',
        'description',
        'isPersistent',
        'isPreemptible',
        'metadata.*',
        'name',
        'namespaceId',
        'releaseId',
        'status',
      ],
    },
  },
});
