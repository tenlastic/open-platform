import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Article, ArticleDocument } from './model';

export const ArticlePermissions = new MongoosePermissions<ArticleDocument>(Article, {
  create: {
    roles: {
      administrator: ['body', 'caption', 'gameId', 'publishedAt', 'title', 'type'],
    },
  },
  delete: {
    roles: {
      administrator: true,
    },
  },
  find: {
    base: {},
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
      name: 'administrator',
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
      administrator: ['body', 'caption', 'gameId', 'publishedAt', 'title', 'type'],
    },
  },
});
