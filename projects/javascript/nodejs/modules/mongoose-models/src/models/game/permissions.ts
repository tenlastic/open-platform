import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Game, GameDocument } from './model';

export const GamePermissions = new MongoosePermissions<GameDocument>(Game, {
  create: {
    roles: {
      administrator: [
        'background',
        'description',
        'icon',
        'images',
        'namespaceId',
        'subtitle',
        'title',
        'videos',
      ],
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
      'background',
      'createdAt',
      'description',
      'icon',
      'images',
      'namespaceId',
      'subtitle',
      'title',
      'updatedAt',
      'videos',
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
      administrator: [
        'background',
        'description',
        'icon',
        'images',
        'namespaceId',
        'subtitle',
        'title',
        'videos',
      ],
    },
  },
});
