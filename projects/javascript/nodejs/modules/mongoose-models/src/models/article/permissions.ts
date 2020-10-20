import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Article, ArticleDocument } from './model';

export const ArticlePermissions = new MongoosePermissions<ArticleDocument>(Article, {
  create: {
    roles: {
      'namespace-administrator': ['body', 'caption', 'namespaceId', 'publishedAt', 'title', 'type'],
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
          namespaceId: {
            $in: {
              // Find all Namespaces that the user is a member of.
              $query: {
                model: 'NamespaceSchema',
                select: '_id',
                where: {
                  'accessControlList.userId': { $eq: { $ref: 'user._id' } },
                },
              },
            },
          },
        },
      ],
    },
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    base: [
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
      name: 'namespace-administrator',
      query: {
        'record.namespaceDocument.accessControlList': {
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
      'namespace-administrator': ['body', 'caption', 'namespaceId', 'publishedAt', 'title', 'type'],
    },
  },
});
