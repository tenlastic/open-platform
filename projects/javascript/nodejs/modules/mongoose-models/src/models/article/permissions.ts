import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Article, ArticleDocument } from './model';

export const ArticlePermissions = new MongoosePermissions<ArticleDocument>(Article, {
  create: {
    'namespace-administrator': [
      'body',
      'caption',
      'gameId',
      'namespaceId',
      'publishedAt',
      'title',
      'type',
    ],
    'user-administrator': [
      'body',
      'caption',
      'gameId',
      'namespaceId',
      'publishedAt',
      'title',
      'type',
    ],
  },
  delete: {
    'namespace-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: {
      $or: [
        { publishedAt: { $exists: true, $ne: null } },
        {
          namespaceId: {
            $in: {
              // Find Namespaces where the Key or User has administrator access.
              $query: {
                model: 'NamespaceSchema',
                select: '_id',
                where: {
                  $or: [
                    {
                      keys: {
                        $elemMatch: {
                          roles: { $eq: 'articles' },
                          value: { $eq: { $ref: 'key' } },
                        },
                      },
                    },
                    {
                      users: {
                        $elemMatch: {
                          _id: { $eq: { $ref: 'user._id' } },
                          roles: { $eq: 'articles' },
                        },
                      },
                    },
                  ],
                },
              },
            },
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
      query: {
        'user.roles': { $eq: 'articles' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'articles' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'articles' },
              },
            },
          },
        ],
      },
    },
  ],
  update: {
    'namespace-administrator': [
      'body',
      'caption',
      'gameId',
      'namespaceId',
      'publishedAt',
      'title',
      'type',
    ],
    'user-administrator': [
      'body',
      'caption',
      'gameId',
      'namespaceId',
      'publishedAt',
      'title',
      'type',
    ],
  },
});
