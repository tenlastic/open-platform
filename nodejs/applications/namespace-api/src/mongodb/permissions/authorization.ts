import { AuthorizationRole } from '../models';

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
                  where: { apiKey: { $exists: false }, ban: true, userId: { $ref: 'user._id' } },
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
                      userId: { $exists: false },
                    },
                    {
                      apiKey: { $exists: false },
                      ban: { $ne: true },
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
              userId: { $exists: false },
            },
          },
        },
        {
          'record.authorizationDocuments': {
            apiKey: { $exists: false },
            ban: { $ne: true },
            roles: { $in: roles },
            userId: { $ref: 'user._id' },
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
          $elemMatch: { apiKey: { $exists: false }, ban: true, userId: { $ref: 'user._id' } },
        },
      },
    };
  },
  getPopulateQuery() {
    return {
      match: {
        $or: [
          { apiKey: { $ref: 'apiKey' }, userId: { $exists: false } },
          { apiKey: { $exists: false }, ban: { $ne: true }, userId: { $ref: 'user._id' } },
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
    return { 'authorization.ban': { $ne: true }, 'authorization.roles': { $in: roles } };
  },
};
