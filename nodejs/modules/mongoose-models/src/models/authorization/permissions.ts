import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { Authorization, AuthorizationDocument, AuthorizationStatus } from './model';

export const AuthorizationPermissions = new MongoosePermissions<AuthorizationDocument>(
  Authorization,
  {
    create: {
      'namespace-administrator': ['namespaceId', 'status', 'userId'],
      owner: ['namespaceId', 'userId'],
      'user-administrator': ['namespaceId', 'status', 'userId'],
    },
    delete: {
      'namespace-administrator': true,
      owner: true,
      'user-administrator': true,
    },
    find: {
      default: {
        $or: [
          NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Authorizations),
          { userId: { $ref: 'user._id' } },
        ],
      },
      'user-administrator': {},
    },
    populate: [{ path: 'namespaceDocument' }],
    read: {
      default: ['_id', 'createdAt', 'namespaceId', 'status', 'updatedAt', 'userId'],
    },
    roles: [
      {
        name: 'user-administrator',
        query: UserPermissionsHelpers.getRoleQuery(UserRole.Authorizations),
      },
      {
        name: 'namespace-administrator',
        query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Authorizations),
      },
      {
        name: 'owner',
        query: {
          'record.status': AuthorizationStatus.Pending,
          'record.userId': { $ref: 'user._id' },
        },
      },
    ],
    update: {
      'namespace-administrator': ['status'],
      'user-administrator': ['status'],
    },
  },
);
