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
                { key: { $ref: 'key' }, roles: { $in: roles } },
                { roles: { $in: roles }, userId: { $ref: 'user._id' } },
              ],
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
            $elemMatch: { key: { $ref: 'key' }, roles: { $in: roles } },
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
          match: { $or: [{ key: { $ref: 'key' } }, { userId: { $ref: 'user._id' } }] },
          path: 'authorizationDocuments',
        },
      ],
    };
  },
  getSystemRoleQuery(roles: AuthorizationRole[], selector = 'record.namespaceDocument') {
    return {
      [`${selector}.authorizationDocuments`]: {
        $elemMatch: { key: { $ref: 'key' }, roles: { $in: roles }, system: true },
      },
    };
  },
  getUserRoleQuery(roles: AuthorizationRole[]) {
    return { [`user.authorizationDocument.roles`]: { $in: roles } };
  },
};
