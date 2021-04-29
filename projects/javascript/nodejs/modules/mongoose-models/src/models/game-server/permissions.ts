import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GamePermissionsHelpers } from '../game';
import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { GameServer, GameServerDocument } from './model';

const administrator = {
  create: [
    'authorizedUserIds',
    'buildId',
    'cpu',
    'currentUserIds',
    'description',
    'gameId',
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'persistent',
    'preemptible',
    'queueId',
  ],
  read: [
    '_id',
    'authorizedUserIds',
    'buildId',
    'cpu',
    'createdAt',
    'currentUserIds',
    'description',
    'endpoints.*',
    'gameId',
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'persistent',
    'preemptible',
    'queueId',
    'status.*',
    'updatedAt',
  ],
  update: [
    'authorizedUserIds',
    'buildId',
    'cpu',
    'currentUserIds',
    'description',
    'gameId',
    'memory',
    'metadata.*',
    'name',
    'preemptible',
  ],
};

export const GameServerPermissions = new MongoosePermissions<GameServerDocument>(GameServer, {
  create: {
    'namespace-administrator': administrator.create,
    'system-administrator': administrator.create,
    'user-administrator': administrator.create,
  },
  delete: {
    'namespace-administrator': true,
    'system-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: {
      $or: [
        { gameId: { $eq: null } },
        { gameId: { $exists: false } },
        { gameId: { $in: GamePermissionsHelpers.getAuthorizedGameIds() } },
        {
          namespaceId: {
            $in: NamespacePermissionsHelpers.getNamespaceIdsByRole(NamespaceRole.GameServers),
          },
        },
      ],
    },
    'system-administrator': {},
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'authorizedUserIds',
      'createdAt',
      'currentUserIds',
      'description',
      'endpoints.*',
      'gameId',
      'metadata.*',
      'name',
      'namespaceId',
      'persistent',
      'queueId',
      'status.phase',
      'updatedAt',
    ],
    'namespace-administrator': administrator.read,
    'system-administrator': administrator.read,
    'user-administrator': administrator.read,
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'game-servers' },
        'user.system': { $eq: true },
      },
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.GameServers),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(
        'record.namespaceDocument',
        NamespaceRole.GameServers,
      ),
    },
  ],
  update: {
    'namespace-administrator': administrator.update,
    'system-administrator': [
      'authorizedUserIds',
      'buildId',
      'cpu',
      'currentUserIds',
      'description',
      'endpoints.*',
      'gameId',
      'memory',
      'metadata.*',
      'name',
      'preemptible',
      'queueId',
      'status.*',
    ],
    'user-administrator': administrator.update,
  },
});
