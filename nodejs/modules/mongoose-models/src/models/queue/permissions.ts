import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GamePermissionsHelpers } from '../game';
import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { Queue, QueueDocument } from './model';

const administrator = {
  create: [
    'buildId',
    'cpu',
    'description',
    'gameId',
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
    'gameId',
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
    'gameId',
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
    'namespace-administrator': administrator.create,
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
        NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Queues),
        NamespacePermissionsHelpers.getNamespaceUserFindQuery(NamespaceRole.Queues),
        { gameId: { $in: GamePermissionsHelpers.getAuthorizedGameIds() } },
        { gameId: null },
        { gameId: { $exists: false } },
      ],
    },
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'createdAt',
      'description',
      'gameId',
      'name',
      'namespaceId',
      'status.phase',
      'teams',
      'updatedAt',
      'usersPerTeam',
    ],
    'namespace-administrator': administrator.read,
    'system-administrator': administrator.read,
    'user-administrator': administrator.read,
  },
  roles: [
    {
      name: 'system-administrator',
      query: NamespacePermissionsHelpers.getNamespaceUserRoleQuery(NamespaceRole.Queues),
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Queues),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Queues),
    },
  ],
  update: {
    'namespace-administrator': administrator.update,
    'system-administrator': [
      'buildId',
      'description',
      'gameId',
      'gameServerTemplate.*',
      'metadata.*',
      'name',
      'replicas',
      'restartedAt',
      'status.*',
      'teams',
      'usersPerTeam',
    ],
    'user-administrator': administrator.update,
  },
});
