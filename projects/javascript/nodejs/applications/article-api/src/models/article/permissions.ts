import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Article, ArticleDocument } from './model';

export const ArticlePermissions = new MongoosePermissions<ArticleDocument>(Article, {
  create: {
    roles: {
      'namespace-administrator': ['body', 'caption', 'gameId', 'publishedAt', 'title', 'type'],
    },
  },
  delete: {
    roles: {
      'namespace-administrator': true,
    },
  },
  find: {
    base: {
      $or: [
        { $and: [{ publishedAt: { $exists: true } }, { publishedAt: { $ne: null } }] },
        {
          gameId: {
            $in: {
              // Find all Games within the returned Namespaces.
              $query: {
                model: 'ReadonlyGameSchema',
                select: '_id',
                where: {
                  namespaceId: {
                    $in: {
                      // Find all Namespaces that the user is a member of.
                      $query: {
                        model: 'ReadonlyNamespaceSchema',
                        select: '_id',
                        where: {
                          'accessControlList.userId': { $ref: 'user._id' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  },
  populate: [{ path: 'gameDocument', populate: { path: 'namespaceDocument' } }],
  read: {
    base: [
      '_id',
      'body',
      'caption',
      'createdAt',
      'gameId',
      'publishedAt',
      'title',
      'type',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'namespace-administrator',
      query: {
        'record.gameDocument.namespaceDocument.accessControlList': {
          $elemMatch: {
            roles: { $eq: 'Administrator' },
            userId: { $eq: { $ref: 'user._id' } },
          },
        },
      },
    },
  ],
  update: {
    roles: {
      'namespace-administrator': ['body', 'caption', 'gameId', 'publishedAt', 'title', 'type'],
    },
  },
});
