import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, NamespaceDocument, NamespaceModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  read: ['_id', 'createdAt', 'limits.*', 'name', 'restartedAt', 'status.*', 'updatedAt'],
};

export const NamespacePermissions = new MongoosePermissions<NamespaceDocument>(NamespaceModel, {
  create: {
    'user-write': ['limits.*', 'name'],
  },
  delete: {
    'user-write': true,
  },
  find: {
    default: AuthorizationPermissionsHelpers.getFindQuery(
      [AuthorizationRole.NamespacesRead],
      '_id',
    ),
    'user-read': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: ['_id', 'createdAt', 'name', 'updatedAt'],
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
      AuthorizationRole.NamespaceLogsRead,
    ]),
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.NamespacesRead,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.NamespacesWrite,
    ]),
    'system-logs': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.NamespaceLogsRead,
    ]),
    'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.NamespacesRead,
    ]),
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.NamespacesWrite,
    ]),
    'user-logs': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.NamespaceLogsRead,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.NamespacesRead,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.NamespacesWrite,
    ]),
  },
  update: {
    'namespace-write': ['name', 'restartedAt'],
    'system-write': ['status.*'],
    'user-write': ['limits.*', 'name', 'restartedAt'],
  },
});
