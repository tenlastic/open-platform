import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { Game, GameDocument } from './model';

const administrator = {
  create: [
    'authorizedUserIds',
    'background',
    'description',
    'icon',
    'images',
    'namespaceId',
    'public',
    'subtitle',
    'title',
    'videos',
    'unauthorizedUserIds',
  ],
  update: [
    'authorizedUserIds',
    'background',
    'description',
    'icon',
    'images',
    'public',
    'subtitle',
    'title',
    'videos',
    'unauthorizedUserIds',
  ],
};

export const GamePermissions = new MongoosePermissions<GameDocument>(Game, {
  create: {
    'namespace-administrator': administrator.create,
    'user-administrator': administrator.create,
  },
  delete: {
    'namespace-administrator': true,
  },
  find: {
    default: {
      $or: [
        { authorizedUserIds: { $eq: { $ref: 'user._id' } }, public: false },
        { unauthorizedUserIds: { $ne: { $ref: 'user._id' } }, public: true },
        {
          namespaceId: {
            $in: NamespacePermissionsHelpers.getNamespaceIdsByRole(NamespaceRole.Games),
          },
        },
      ],
    },
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'authorizedUserIds',
      'background',
      'createdAt',
      'description',
      'icon',
      'images',
      'namespaceId',
      'public',
      'subtitle',
      'title',
      'updatedAt',
      'videos',
      'unauthorizedUserIds',
    ],
  },
  roles: [
    {
      name: 'user-administrator',
      query: { 'user.roles': { $eq: 'game-servers' } },
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(
        'record.namespaceDocument',
        NamespaceRole.Games,
      ),
    },
  ],
  update: {
    'namespace-administrator': administrator.update,
    'user-administrator': administrator.update,
  },
});

export const GamePermissionsHelpers = {
  getAuthorizedGameIds() {
    return {
      $query: {
        model: 'GameSchema',
        select: '_id',
        where: {
          $or: [
            { authorizedUserIds: { $eq: { $ref: 'user._id' } }, public: false },
            { unauthorizedUserIds: { $ne: { $ref: 'user._id' } }, public: true },
          ],
        },
      },
    };
  },
};
