import { AuthorizationRole } from '@tenlastic/mongoose';
import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Queue, QueueDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: [
    'buildId',
    'cpu',
    'description',
    'gameServerTemplate.*',
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'preemptible',
    'replicas',
    'restartedAt',
    'teams',
    'usersPerTeam',
  ],
  read: [
    '_id',
    'buildId',
    'cpu',
    'createdAt',
    'description',
    'gameServerTemplate.*',
    'logs',
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'preemptible',
    'replicas',
    'restartedAt',
    'status.*',
    'teams',
    'updatedAt',
    'usersPerTeam',
  ],
  update: [
    'buildId',
    'cpu',
    'description',
    'gameServerTemplate.*',
    'memory',
    'metadata.*',
    'name',
    'preemptible',
    'replicas',
    'restartedAt',
    'teams',
    'usersPerTeam',
  ],
};

export const QueuePermissions = new MongoosePermissions<QueueDocument>(Queue, {
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
      'createdAt',
      'description',
      'name',
      'namespaceId',
      'status.phase',
      'teams',
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
      'description',
      'gameServerTemplate.*',
      'metadata.*',
      'name',
      'replicas',
      'restartedAt',
      'status.*',
      'teams',
      'usersPerTeam',
    ],
    'user-write': administrator.update,
  },
});
