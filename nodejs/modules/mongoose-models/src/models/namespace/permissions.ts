import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole } from '../authorization/model';
import { AuthorizationPermissionsHelpers } from '../authorization/permissions.helpers';
import { Namespace, NamespaceDocument } from './model';

const administrator = {
  read: ['_id', 'createdAt', 'limits.*', 'name', 'updatedAt'],
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
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.NamespacesReadWrite,
      ]),
    },
    {
      name: 'namespace-write',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery(
        [AuthorizationRole.NamespacesReadWrite],
        'record',
      ),
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
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery(
        [AuthorizationRole.NamespacesRead, AuthorizationRole.NamespacesReadWrite],
        'record',
      ),
    },
  ],
  update: {
    'namespace-write': ['name'],
    'user-write': ['limits.*', 'name'],
  },
});
