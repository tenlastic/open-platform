import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { ArticleDocument, ArticleModel, AuthorizationRole } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: ['body', 'namespaceId', 'publishedAt', 'subtitle', 'title', 'type'],
  update: ['body', 'publishedAt', 'subtitle', 'title', 'type'],
};

export const ArticlePermissions = new MongoosePermissions<ArticleDocument>(ArticleModel, {
  create: {
    'namespace-write': administrator.create,
    'user-write': administrator.create,
  },
  delete: {
    'namespace-write': true,
    'user-write': true,
  },
  find: {
    default: {
      $or: [
        AuthorizationPermissionsHelpers.getFindQuery([
          AuthorizationRole.ArticlesRead,
          AuthorizationRole.ArticlesReadWrite,
        ]),
        {
          ...AuthorizationPermissionsHelpers.getFindQuery([
            AuthorizationRole.ArticlesReadPublished,
          ]),
          publishedAt: { $exists: true, $ne: null },
        },
      ],
    },
    'user-read': {},
    'user-read-published': { publishedAt: { $exists: true, $ne: null } },
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'body',
      'createdAt',
      'namespaceId',
      'publishedAt',
      'subtitle',
      'title',
      'type',
      'updatedAt',
    ],
  },
  roles: {
    default: {},
    'namespace-read': {
      $or: [
        AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
          AuthorizationRole.ArticlesRead,
          AuthorizationRole.ArticlesReadWrite,
        ]),
        {
          ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
            AuthorizationRole.ArticlesReadPublished,
          ]),
          publishedAt: { $exists: true, $ne: null },
        },
      ],
    },
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.ArticlesReadWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.ArticlesRead,
      AuthorizationRole.ArticlesReadWrite,
    ]),
    'user-read-published': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.ArticlesReadPublished,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.ArticlesReadWrite,
    ]),
  },
  update: {
    'namespace-write': administrator.update,
    'user-write': administrator.update,
  },
});
