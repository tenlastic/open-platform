import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GamePermissionsHelpers } from '../game';
import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { Article, ArticleDocument } from './model';

const administrator = {
  create: ['body', 'caption', 'gameId', 'namespaceId', 'publishedAt', 'title', 'type'],
  update: ['body', 'caption', 'gameId', 'namespaceId', 'publishedAt', 'title', 'type'],
};

export const ArticlePermissions = new MongoosePermissions<ArticleDocument>(Article, {
  create: {
    'namespace-administrator': administrator.create,
    'user-administrator': administrator.create,
  },
  delete: {
    'namespace-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: {
      $or: [
        {
          gameId: { $in: GamePermissionsHelpers.getAuthorizedGameIds() },
          publishedAt: { $exists: true, $ne: null },
        },
        {
          namespaceId: {
            $in: NamespacePermissionsHelpers.getNamespaceIdsByRole(NamespaceRole.Articles),
          },
        },
      ],
    },
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'body',
      'caption',
      'createdAt',
      'gameId',
      'namespaceId',
      'publishedAt',
      'title',
      'type',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Articles),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(
        'record.namespaceDocument',
        NamespaceRole.Articles,
      ),
    },
  ],
  update: {
    'namespace-administrator': administrator.update,
    'user-administrator': administrator.update,
  },
});
