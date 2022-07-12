import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Authorization, AuthorizationDocument, AuthorizationRole } from './model';
import { AuthorizationPermissionsHelpers } from './permissions.helpers';

export const AuthorizationPermissions = new MongoosePermissions<AuthorizationDocument>(
  Authorization,
  {
    create: {
      'namespace-write': ['name', 'namespaceId', 'roles', 'userId'],
      'user-write': ['name', 'namespaceId', 'roles', 'userId'],
    },
    delete: {
      'namespace-write': true,
      'user-write': true,
    },
    find: {
      default: {
        $or: [
          AuthorizationPermissionsHelpers.getFindQuery([
            AuthorizationRole.AuthorizationsRead,
            AuthorizationRole.AuthorizationsReadWrite,
          ]),
          { userId: { $ref: 'user._id' } },
        ],
      },
      'user-read': {},
      'user-write': {},
    },
    populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
    read: {
      default: [
        '_id',
        'createdAt',
        'key',
        'name',
        'namespaceId',
        'roles',
        'system',
        'updatedAt',
        'userId',
      ],
    },
    roles: [
      {
        name: 'user-write',
        query: AuthorizationPermissionsHelpers.getUserRoleQuery([
          AuthorizationRole.AuthorizationsReadWrite,
        ]),
      },
      {
        name: 'namespace-write',
        query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
          AuthorizationRole.AuthorizationsReadWrite,
        ]),
      },
      {
        name: 'user-read',
        query: AuthorizationPermissionsHelpers.getUserRoleQuery([
          AuthorizationRole.AuthorizationsRead,
          AuthorizationRole.AuthorizationsReadWrite,
        ]),
      },

      {
        name: 'namespace-read',
        query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
          AuthorizationRole.AuthorizationsRead,
          AuthorizationRole.AuthorizationsReadWrite,
        ]),
      },
    ],
    update: {
      'namespace-write': ['name', 'roles'],
      'user-write': ['name', 'roles'],
    },
  },
);
