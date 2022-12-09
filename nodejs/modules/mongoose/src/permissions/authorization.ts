import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationDocument, AuthorizationModel, AuthorizationRole } from '../models';

export const AuthorizationPermissionsHelpers = {
  getFindQuery(roles: AuthorizationRole[], selector = 'namespaceId') {
    return {
      $and: [
        {
          _id: {
            $not: {
              $exists: {
                $query: {
                  boolean: true,
                  isOne: true,
                  model: 'AuthorizationSchema',
                  where: {
                    bannedAt: { $exists: true, $ne: null },
                    userId: { $ref: 'user._id' },
                  },
                },
              },
            },
          },
        },
        {
          [selector]: {
            $in: {
              $query: {
                model: 'AuthorizationSchema',
                select: 'namespaceId',
                where: {
                  $or: [
                    { apiKey: { $ref: 'apiKey' }, roles: { $in: roles } },
                    { roles: { $in: roles }, userId: { $ref: 'user._id' } },
                    {
                      apiKey: { $exists: false },
                      roles: { $in: roles },
                      userId: { $exists: false },
                    },
                  ],
                  namespaceId: { $exists: true },
                },
              },
            },
          },
        },
      ],
    };
  },
  getNamespaceRoleQuery(roles: AuthorizationRole[]) {
    return {
      $or: [
        {
          'record.authorizationDocuments': {
            $elemMatch: { apiKey: { $ref: 'apiKey' }, roles: { $in: roles } },
          },
        },
        {
          'record.authorizationDocuments': {
            $elemMatch: { roles: { $in: roles }, userId: { $ref: 'user._id' } },
          },
        },
        {
          'record.authorizationDocuments': {
            $elemMatch: {
              apiKey: { $exists: false },
              roles: { $in: roles },
              userId: { $exists: false },
            },
          },
        },
      ],
      'record.authorizationDocuments': {
        $not: {
          $elemMatch: { bannedAt: { $exists: true, $ne: null }, userId: { $ref: 'user._id' } },
        },
      },
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
      'record.authorizationDocuments': {
        $elemMatch: { apiKey: { $ref: 'apiKey' }, roles: { $in: roles }, system: true },
      },
    };
  },
  getUserRoleQuery(roles: AuthorizationRole[]) {
    return { 'authorization.bannedAt': { $exists: false }, 'authorization.roles': { $in: roles } };
  },
};

export const AuthorizationPermissions = new MongoosePermissions<AuthorizationDocument>(
  AuthorizationModel,
  {
    create: {
      'namespace-write': ['apiKey', 'bannedAt', 'name', 'namespaceId', 'roles', 'userId'],
      'user-write': ['apiKey', 'bannedAt', 'name', 'namespaceId', 'roles', 'userId'],
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
          {
            apiKey: { $exists: false },
            namespaceId: { $exists: true },
            userId: { $exists: false },
          },
          { userId: { $ref: 'user._id' } },
        ],
        system: { $exists: false },
      },
      'user-read': { system: { $exists: false } },
    },
    populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
    read: {
      default: [
        '_id',
        'bannedAt',
        'createdAt',
        'name',
        'namespaceId',
        'roles',
        'updatedAt',
        'userId',
      ],
    },
    roles: {
      default: {},
      'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.AuthorizationsRead,
        AuthorizationRole.AuthorizationsReadWrite,
      ]),
      'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.AuthorizationsReadWrite,
      ]),
      'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.AuthorizationsRead,
        AuthorizationRole.AuthorizationsReadWrite,
      ]),
      'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.AuthorizationsReadWrite,
      ]),
    },
    update: {
      'namespace-write': ['bannedAt', 'name', 'roles'],
      'user-write': ['bannedAt', 'name', 'roles'],
    },
  },
);
