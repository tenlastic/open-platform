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
        AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.ArticlesRead]),
        {
          ...AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.ArticlesPlay]),
          publishedAt: { $lte: { $ref: 'now' } },
        },
      ],
    },
    'user-read': {},
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
        AuthorizationPermissionsHelpers.getNamespaceRoleQuery([AuthorizationRole.ArticlesRead]),
        {
          ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
            AuthorizationRole.ArticlesPlay,
          ]),
          publishedAt: { $exists: true },
        },
      ],
    },
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.ArticlesWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.ArticlesRead]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.ArticlesWrite,
    ]),
  },
  update: {
    'namespace-write': administrator.update,
    'user-write': administrator.update,
  },
});
