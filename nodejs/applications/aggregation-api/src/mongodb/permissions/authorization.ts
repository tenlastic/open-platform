import { AuthorizationRole } from '@tenlastic/mongoose';

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
                    {
                      apiKey: { $ref: 'apiKey' },
                      roles: { $in: roles },
                    },
                    {
                      roles: { $in: roles },
                      userId: { $ref: 'user._id' },
                    },
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
            $elemMatch: {
              apiKey: { $ref: 'apiKey' },
              roles: { $in: roles },
            },
          },
        },
        {
          'record.authorizationDocuments': {
            $elemMatch: {
              roles: { $in: roles },
              userId: { $ref: 'user._id' },
            },
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
          $elemMatch: {
            bannedAt: { $exists: true, $ne: null },
            userId: { $ref: 'user._id' },
          },
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
    return {
      $or: [{ 'authorization.bannedAt': null }, { 'authorization.bannedAt': { $exists: false } }],
      'authorization.roles': { $in: roles },
    };
  },
};
