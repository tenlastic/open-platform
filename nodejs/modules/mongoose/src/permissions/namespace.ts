import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, NamespaceDocument, NamespaceModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  read: ['_id', 'createdAt', 'limits.*', 'logs', 'name', 'status.*', 'updatedAt'],
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
    'namespace-read': administrator.read,
    'system-read': administrator.read,
    'user-read': administrator.read,
  },
  roles: {
    default: {},
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.NamespacesRead,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.NamespacesWrite,
    ]),
    'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.NamespacesRead,
    ]),
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.NamespacesWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.NamespacesRead,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.NamespacesWrite,
    ]),
  },
  update: {
    'namespace-write': ['name'],
    'system-write': ['status.*'],
    'user-write': ['limits.*', 'name'],
  },
});
