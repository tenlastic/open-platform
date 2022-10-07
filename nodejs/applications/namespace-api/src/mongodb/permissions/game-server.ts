import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, GameServer, GameServerDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

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
    'namespace-write': administrator.create,
    'system-write': administrator.create,
    'user-write': administrator.create,
  },
  delete: {
    'namespace-write': true,
    'system-write': true,
    'user-write': true,
  },
  find: {
    default: AuthorizationPermissionsHelpers.getFindQuery([
      AuthorizationRole.GameServersRead,
      AuthorizationRole.GameServersReadWrite,
    ]),
    'user-read': {},
    'user-write': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
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
    'namespace-read': administrator.read,
    'namespace-write': administrator.read,
    'system-read': administrator.read,
    'system-write': administrator.read,
    'user-read': administrator.read,
    'user-write': administrator.read,
  },
  roles: [
    {
      name: 'system-write',
      query: AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.GameServersReadWrite,
      ]),
    },
    {
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.GameServersReadWrite,
      ]),
    },
    {
      name: 'namespace-write',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.GameServersReadWrite,
      ]),
    },
    {
      name: 'system-read',
      query: AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.GameServersRead,
        AuthorizationRole.GameServersReadWrite,
      ]),
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.GameServersRead,
        AuthorizationRole.GameServersReadWrite,
      ]),
    },
    {
      name: 'namespace-read',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.GameServersRead,
        AuthorizationRole.GameServersReadWrite,
      ]),
    },
  ],
  update: {
    'namespace-write': administrator.update,
    'system-write': [
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
    'user-write': administrator.update,
  },
});
