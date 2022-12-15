import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, QueueDocument, QueueModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: [
    'buildId',
    'confirmation',
    'cpu',
    'description',
    'gameServerTemplate.*',
    'invitationSeconds',
    'memory',
    'name',
    'namespaceId',
    'preemptible',
    'replicas',
    'restartedAt',
    'thresholds.*',
    'usersPerTeam',
  ],
  read: [
    '_id',
    'buildId',
    'confirmation',
    'cpu',
    'createdAt',
    'description',
    'gameServerTemplate.*',
    'invitationSeconds',
    'logs',
    'memory',
    'name',
    'namespaceId',
    'preemptible',
    'replicas',
    'restartedAt',
    'status.*',
    'thresholds.*',
    'updatedAt',
    'usersPerTeam',
  ],
  update: [
    'buildId',
    'confirmation',
    'cpu',
    'description',
    'gameServerTemplate.*',
    'invitationSeconds',
    'memory',
    'name',
    'preemptible',
    'replicas',
    'restartedAt',
    'thresholds.*',
    'usersPerTeam',
  ],
};

export const QueuePermissions = new MongoosePermissions<QueueDocument>(QueueModel, {
  create: {
    'namespace-write': administrator.create,
    'user-write': administrator.create,
  },
  delete: {
    'namespace-write': true,
    'system-write': true,
    'user-write': true,
  },
  find: {
    default: AuthorizationPermissionsHelpers.getFindQuery([
      AuthorizationRole.QueuesRead,
      AuthorizationRole.QueuesReadWrite,
    ]),
    'user-read': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'confirmation',
      'createdAt',
      'description',
      'invitationSeconds',
      'name',
      'namespaceId',
      'status.phase',
      'thresholds.*',
      'updatedAt',
      'usersPerTeam',
    ],
    'namespace-read': administrator.read,
    'system-read': administrator.read,
    'user-read': administrator.read,
  },
  roles: {
    default: {},
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.QueuesRead,
      AuthorizationRole.QueuesReadWrite,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.QueuesReadWrite,
    ]),
    'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.QueuesRead,
      AuthorizationRole.QueuesReadWrite,
    ]),
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.QueuesReadWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.QueuesRead,
      AuthorizationRole.QueuesReadWrite,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.QueuesReadWrite,
    ]),
  },
  update: {
    'namespace-write': administrator.update,
    'system-write': [
      'buildId',
      'confirmation',
      'description',
      'gameServerTemplate.*',
      'invitationSeconds',
      'name',
      'replicas',
      'restartedAt',
      'status.*',
      'thresholds.*',
      'usersPerTeam',
    ],
    'user-write': administrator.update,
  },
});
