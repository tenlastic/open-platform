import { AuthorizationRole } from './model';

export const AuthorizationPermissionsHelpers = {
  getFindQuery(roles: AuthorizationRole[]) {
    return {
      namespaceId: {
        $in: {
          $query: {
            model: 'AuthorizationSchema',
            select: 'namespaceId',
            where: {
              $or: [
                { apiKey: { $ref: 'apiKey' }, roles: { $in: roles } },
                { roles: { $in: roles }, userId: { $ref: 'user._id' } },
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
      ],
    };
  },
  getPopulateQuery(path = 'namespaceDocument') {
    return {
      path,
      populate: [
        {
          match: { $or: [{ apiKey: { $ref: 'apiKey' } }, { userId: { $ref: 'user._id' } }] },
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
