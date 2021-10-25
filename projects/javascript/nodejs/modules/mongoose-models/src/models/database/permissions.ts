import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { Database, DatabaseDocument } from './model';

const administrator = {
  create: [
    'cpu',
    'gameId',
    'memory',
    'name',
    'namespaceId',
    'preemptible',
    'replicas',
    'restartedAt',
    'storage',
  ],
  read: [
    '_id',
    'cpu',
    'createdAt',
    'gameId',
    'logs',
    'memory',
    'name',
    'namespaceId',
    'preemptible',
    'replicas',
    'restartedAt',
    'status.*',
    'storage',
    'updatedAt',
  ],
  update: ['cpu', 'gameId', 'memory', 'name', 'preemptible', 'replicas', 'restartedAt', 'storage'],
};

export const DatabasePermissions = new MongoosePermissions<DatabaseDocument>(Database, {
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
        NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Databases),
        NamespacePermissionsHelpers.getNamespaceUserFindQuery(NamespaceRole.Databases),
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
      query: NamespacePermissionsHelpers.getNamespaceUserRoleQuery(NamespaceRole.Databases),
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Databases),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Databases),
    },
  ],
  update: {
    'namespace-administrator': administrator.update,
    'system-administrator': [
      'cpu',
      'gameId',
      'memory',
      'name',
      'preemptible',
      'replicas',
      'restartedAt',
      'status.*',
      'storage',
    ],
    'user-administrator': administrator.update,
  },
});
