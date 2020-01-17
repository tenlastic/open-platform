import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Game, GameDocument } from './model';

export const GamePermissions = new MongoosePermissions<GameDocument>(Game, {
  create: {
    roles: {
      administrator: ['description', 'namespaceId', 'slug', 'subtitle', 'title'],
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
  populate: [{ path: 'namespaceDocument' }],
  read: {
    base: [
      '_id',
      'createdAt',
      'description',
      'namespaceId',
      'slug',
      'subtitle',
      'title',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'administrator',
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
      administrator: ['description', 'namespaceId', 'slug', 'subtitle', 'title'],
    },
  },
});
