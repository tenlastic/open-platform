import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationPermissionsHelpers, AuthorizationRole } from '../authorization';
import { Article, ArticleDocument } from './model';

const administrator = {
  create: ['body', 'caption', 'namespaceId', 'publishedAt', 'title', 'type'],
  update: ['body', 'caption', 'namespaceId', 'publishedAt', 'title', 'type'],
};

export const ArticlePermissions = new MongoosePermissions<ArticleDocument>(Article, {
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
          publishedAt: { $ne: null },
        },
      ],
    },
    'user-read': {},
    'user-read-published': { publishedAt: { $ne: null } },
    'user-write': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'body',
      'caption',
      'createdAt',
      'namespaceId',
      'publishedAt',
      'title',
      'type',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.ArticlesReadWrite,
      ]),
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.ArticlesRead,
        AuthorizationRole.ArticlesReadWrite,
      ]),
    },
    {
      name: 'user-read-published',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.ArticlesReadPublished,
      ]),
    },
    {
      name: 'namespace-write',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.ArticlesReadWrite,
      ]),
    },
    {
      name: 'namespace-read',
      query: {
        $or: [
          AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
            AuthorizationRole.ArticlesRead,
            AuthorizationRole.ArticlesReadWrite,
          ]),
          {
            ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
              AuthorizationRole.ArticlesReadPublished,
            ]),
            publishedAt: { $ne: null },
          },
        ],
      },
    },
  ],
  update: {
    'namespace-write': administrator.update,
    'user-write': administrator.update,
  },
});
