import { AuthorizationRole } from './model';

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
  getNamespaceRoleQuery(roles: AuthorizationRole[], selector = 'record.namespaceDocument') {
    return {
      $or: [
        {
          [`${selector}.authorizationDocuments`]: {
            $elemMatch: { apiKey: { $ref: 'apiKey' }, roles: { $in: roles } },
          },
        },
        {
          [`${selector}.authorizationDocuments`]: {
            $elemMatch: { roles: { $in: roles }, userId: { $ref: 'user._id' } },
          },
        },
        {
          [`${selector}.authorizationDocuments`]: {
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
  getPopulateQuery(path = 'namespaceDocument') {
    return {
      path,
      populate: [
        {
          match: {
            $or: [
              { apiKey: { $ref: 'apiKey' } },
              { userId: { $ref: 'user._id' } },
              { apiKey: { $exists: false }, userId: { $exists: false } },
            ],
          },
          path: 'authorizationDocuments',
        },
      ],
    };
  },
  getSystemRoleQuery(roles: AuthorizationRole[], selector = 'record.namespaceDocument') {
    return {
      [`${selector}.authorizationDocuments`]: {
        $elemMatch: { apiKey: { $ref: 'apiKey' }, roles: { $in: roles }, system: true },
      },
    };
  },
  getUserRoleQuery(roles: AuthorizationRole[]) {
    return { 'authorization.roles': { $in: roles } };
  },
};
