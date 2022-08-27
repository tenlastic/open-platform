import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Authorization, AuthorizationDocument, AuthorizationRole } from '../models';

export const AuthorizationPermissionsHelpers = {
  getFindQuery(roles: AuthorizationRole[], selector = 'namespaceId') {
    return {
      [selector]: {
        $in: {
          $query: {
            model: 'AuthorizationSchema',
            select: 'namespaceId',
            where: {
              $or: [
                { apiKey: { $ref: 'apiKey' }, roles: { $in: roles }, userId: { $exists: false } },
                { apiKey: { $exists: false }, roles: { $in: roles }, userId: { $ref: 'user._id' } },
                { apiKey: { $exists: false }, roles: { $in: roles }, userId: { $exists: false } },
              ],
              namespaceId: { $exists: true },
            },
          },
        },
      },
    };
  },
  getNamespaceRoleQuery(roles: AuthorizationRole[]) {
    return {
      $or: [
        {
          [`record.authorizationDocuments`]: {
            $elemMatch: { apiKey: { $ref: 'apiKey' }, roles: { $in: roles } },
          },
        },
        {
          [`record.authorizationDocuments`]: {
            $elemMatch: { roles: { $in: roles }, userId: { $ref: 'user._id' } },
          },
        },
        {
          [`record.authorizationDocuments`]: {
            $elemMatch: {
              apiKey: { $exists: false },
              roles: { $in: roles },
              userId: { $exists: false },
            },
          },
        },
      ],
    };
  },
  getPopulateQuery() {
    return {
      match: {
        $or: [
          { apiKey: { $ref: 'apiKey' } },
          { userId: { $ref: 'user._id' } },
          { apiKey: { $exists: false }, userId: { $exists: false } },
        ],
      },
      path: 'authorizationDocuments',
    };
  },
  getSystemRoleQuery(roles: AuthorizationRole[]) {
    return {
      [`record.authorizationDocuments`]: {
        $elemMatch: { apiKey: { $ref: 'apiKey' }, roles: { $in: roles }, system: true },
      },
    };
  },
  getUserRoleQuery(roles: AuthorizationRole[]) {
    return { 'authorization.roles': { $in: roles } };
  },
};

export const AuthorizationPermissions = new MongoosePermissions<AuthorizationDocument>(
  Authorization,
  {
    create: {
      'namespace-write': ['apiKey', 'name', 'roles', 'userId'],
      'user-write': ['apiKey', 'name', 'roles', 'userId'],
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
        system: { $exists: false },
      },
      'user-read': { system: { $exists: false } },
      'user-write': { system: { $exists: false } },
    },
    populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
    read: {
      default: ['_id', 'createdAt', 'name', 'namespaceId', 'roles', 'updatedAt', 'userId'],
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
