import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, Namespace, NamespaceDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  read: ['_id', 'createdAt', 'limits.*', 'name', 'status.*', 'updatedAt'],
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
    'user-write': {},
  },
  populate: [
    {
      match: { $or: [{ apiKey: { $ref: 'apiKey' } }, { userId: { $ref: 'user._id' } }] },
      path: 'authorizationDocuments',
    },
  ],
  read: {
    default: ['_id', 'createdAt', 'name', 'updatedAt'],
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
        AuthorizationRole.NamespacesReadWrite,
      ]),
    },
    {
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.NamespacesReadWrite,
      ]),
    },
    {
      name: 'namespace-write',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.NamespacesReadWrite,
      ]),
    },
    {
      name: 'system-read',
      query: AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.NamespacesRead,
        AuthorizationRole.NamespacesReadWrite,
      ]),
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.NamespacesRead,
        AuthorizationRole.NamespacesReadWrite,
      ]),
    },

    {
      name: 'namespace-read',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.NamespacesRead,
        AuthorizationRole.NamespacesReadWrite,
      ]),
    },
  ],
  update: {
    'namespace-write': ['name'],
    'system-write': ['status.*'],
    'user-write': ['limits.*', 'name'],
  },
});
