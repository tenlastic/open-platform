import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Game, GameDocument } from './model';

export const GamePermissions = new MongoosePermissions<GameDocument>(Game, {
  create: {
    'namespace-administrator': [
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
  delete: {
    'namespace-administrator': true,
  },
  find: {
    default: {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
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
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'games' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'games' },
              },
            },
          },
        ],
      },
    },
  ],
  update: {
    'namespace-administrator': [
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
});
