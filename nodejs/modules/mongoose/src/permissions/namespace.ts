import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, Namespace, NamespaceDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  read: ['_id', 'createdAt', 'limits.*', 'logs', 'name', 'status.*', 'updatedAt'],
};

export const NamespacePermissions = new MongoosePermissions<NamespaceDocument>(Namespace, {
  create: {
    'user-write': ['limits.*', 'name'],
  },
  delete: {
    'user-write': true,
  },
  find: {
    default: AuthorizationPermissionsHelpers.getFindQuery(
      [AuthorizationRole.NamespacesRead, AuthorizationRole.NamespacesReadWrite],
      '_id',
    ),
    'user-read': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: ['_id', 'createdAt', 'name', 'updatedAt'],
    'namespace-read': administrator.read,
    'system-read': administrator.read,
    'user-read': administrator.read,
  },
  roles: {
    default: {},
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.NamespacesRead,
      AuthorizationRole.NamespacesReadWrite,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.NamespacesReadWrite,
    ]),
    'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.NamespacesRead,
      AuthorizationRole.NamespacesReadWrite,
    ]),
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.NamespacesReadWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.NamespacesRead,
      AuthorizationRole.NamespacesReadWrite,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.NamespacesReadWrite,
    ]),
  },
  update: {
    'namespace-write': ['name'],
    'system-write': ['status.*'],
    'user-write': ['limits.*', 'name'],
  },
});
