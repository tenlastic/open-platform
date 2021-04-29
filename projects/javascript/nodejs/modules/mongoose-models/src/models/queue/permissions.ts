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
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'preemptible',
    'replicas',
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
        { gameId: { $eq: null } },
        { gameId: { $exists: false } },
        { gameId: { $in: GamePermissionsHelpers.getAuthorizedGameIds() } },
        {
          namespaceId: {
            $in: NamespacePermissionsHelpers.getNamespaceIdsByRole(NamespaceRole.Queues),
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
      query: {
        'user.roles': { $eq: 'queues' },
        'user.system': { $eq: true },
      },
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Queues),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(
        'record.namespaceDocument',
        NamespaceRole.Queues,
      ),
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
      'status.*',
      'teams',
      'usersPerTeam',
    ],
    'user-administrator': administrator.update,
  },
});
