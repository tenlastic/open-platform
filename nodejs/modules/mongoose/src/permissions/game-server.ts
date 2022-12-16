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
    'persistent',
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
    'logs',
    'matchId',
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'persistent',
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
        AuthorizationPermissionsHelpers.getFindQuery([
          AuthorizationRole.GameServersRead,
          AuthorizationRole.GameServersReadWrite,
        ]),
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
      'persistent',
      'queueId',
      'restartedAt',
      'status.endpoints.*',
      'status.phase',
      'updatedAt',
    ],
    'namespace-read': administrator.read,
    'system-read': administrator.read,
    'user-read': administrator.read,
  },
  roles: {
    default: {},
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.GameServersRead,
      AuthorizationRole.GameServersReadWrite,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.GameServersReadWrite,
    ]),
    'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.GameServersRead,
      AuthorizationRole.GameServersReadWrite,
    ]),
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.GameServersReadWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.GameServersRead,
      AuthorizationRole.GameServersReadWrite,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.GameServersReadWrite,
    ]),
  },
  update: {
    'namespace-write': administrator.update,
    'system-write': [...administrator.update, 'status.*'],
    'user-write': administrator.update,
  },
});
