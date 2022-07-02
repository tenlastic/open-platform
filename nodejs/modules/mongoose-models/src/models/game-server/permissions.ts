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
    'logs',
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'persistent',
    'preemptible',
    'restartedAt',
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
    'memory',
    'metadata.*',
    'name',
    'preemptible',
    'restartedAt',
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
        NamespacePermissionsHelpers.getFindQuery(NamespaceRole.GameServers),
        NamespacePermissionsHelpers.getNamespaceUserFindQuery(NamespaceRole.GameServers),
        { namespaceId: { $in: GamePermissionsHelpers.getAuthorizedNamespaceIds() } },
      ],
    },
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
      'metadata.*',
      'name',
      'namespaceId',
      'persistent',
      'queueId',
      'restartedAt',
      'status.endpoints.*',
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
      query: NamespacePermissionsHelpers.getNamespaceUserRoleQuery(NamespaceRole.GameServers),
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.GameServers),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.GameServers),
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
      'memory',
      'metadata.*',
      'name',
      'preemptible',
      'restartedAt',
      'status.*',
    ],
    'user-administrator': administrator.update,
  },
});
