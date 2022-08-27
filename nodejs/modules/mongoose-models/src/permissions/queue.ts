import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, Queue, QueueDocument } from '../models';
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
    'user-write': {},
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
        AuthorizationRole.QueuesReadWrite,
      ]),
    },
    {
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.QueuesReadWrite]),
    },
    {
      name: 'namespace-write',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.QueuesReadWrite,
      ]),
    },
    {
      name: 'system-read',
      query: AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.QueuesRead,
        AuthorizationRole.QueuesReadWrite,
      ]),
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.QueuesRead,
        AuthorizationRole.QueuesReadWrite,
      ]),
    },
    {
      name: 'namespace-read',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.QueuesRead,
        AuthorizationRole.QueuesReadWrite,
      ]),
    },
  ],
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
