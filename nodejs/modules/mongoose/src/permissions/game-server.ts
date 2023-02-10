import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, GameServerDocument, GameServerModel } from '../models';
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
    'ports.*',
    'preemptible',
    'probes.*',
  ],
  read: [
    '_id',
    'authorizedUserIds',
    'buildId',
    'cpu',
    'createdAt',
    'currentUserIds',
    'description',
    'matchId',
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'ports.*',
    'preemptible',
    'probes.*',
    'queueId',
    'restartedAt',
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
    'ports.*',
    'preemptible',
    'probes.*',
    'restartedAt',
  ],
};

export const GameServerPermissions = new MongoosePermissions<GameServerDocument>(GameServerModel, {
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
    default: {
      $or: [
        AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.GameServersRead]),
        {
          ...AuthorizationPermissionsHelpers.getFindQuery([
            AuthorizationRole.GameServersReadAuthorized,
          ]),
          $or: [{ authorizedUserIds: { $size: 0 } }, { authorizedUserIds: { $ref: 'user._id' } }],
        },
      ],
    },
    'user-read': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'authorizedUserIds',
      'createdAt',
      'currentUserIds',
      'description',
      'matchId',
      'metadata.*',
      'name',
      'namespaceId',
      'queueId',
      'restartedAt',
      'status.endpoints.*',
      'status.phase',
      'updatedAt',
    ],
    'namespace-logs': ['logs'],
    'namespace-read': administrator.read,
    'system-logs': ['logs'],
    'system-read': administrator.read,
    'user-logs': ['logs'],
    'user-read': administrator.read,
  },
  roles: {
    default: {},
    'namespace-logs': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.GameServerLogsRead,
    ]),
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.GameServersRead,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.GameServersWrite,
    ]),
    'system-logs': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.GameServerLogsRead,
    ]),
    'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.GameServersRead,
    ]),
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.GameServersWrite,
    ]),
    'user-logs': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.GameServerLogsRead,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.GameServersRead,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.GameServersWrite,
    ]),
  },
  update: {
    'namespace-write': administrator.update,
    'system-write': [...administrator.update, 'status.*'],
    'user-write': administrator.update,
  },
});
