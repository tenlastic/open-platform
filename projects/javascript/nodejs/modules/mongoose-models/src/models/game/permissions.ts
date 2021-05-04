import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GameAuthorizationStatus } from '../game-authorization';
import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { Game, GameAccess, GameDocument } from './model';

const administrator = {
  create: [
    'access',
    'background',
    'description',
    'icon',
    'images',
    'namespaceId',
    'subtitle',
    'title',
    'videos',
  ],
  update: ['access', 'background', 'description', 'icon', 'images', 'subtitle', 'title', 'videos'],
};

export const GamePermissions = new MongoosePermissions<GameDocument>(Game, {
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
        NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Games),
        {
          _id: {
            $in: {
              $query: {
                model: 'GameAuthorizationSchema',
                select: 'gameId',
                where: {
                  status: GameAuthorizationStatus.Granted,
                  userId: { $ref: 'user._id' },
                },
              },
            },
          },
          access: GameAccess.Private,
        },
        {
          _id: {
            $nin: {
              $query: {
                model: 'GameAuthorizationSchema',
                select: 'gameId',
                where: {
                  status: GameAuthorizationStatus.Revoked,
                  userId: { $ref: 'user._id' },
                },
              },
            },
          },
          access: { $ne: GameAccess.Private },
        },
      ],
    },
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'access',
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
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Games),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Games),
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
            {
              _id: {
                $in: {
                  $query: {
                    model: 'GameAuthorizationSchema',
                    select: 'gameId',
                    where: {
                      status: GameAuthorizationStatus.Granted,
                      userId: { $ref: 'user._id' },
                    },
                  },
                },
              },
              access: GameAccess.Private,
            },
            {
              _id: {
                $nin: {
                  $query: {
                    model: 'GameAuthorizationSchema',
                    select: 'gameId',
                    where: {
                      status: GameAuthorizationStatus.Revoked,
                      userId: { $ref: 'user._id' },
                    },
                  },
                },
              },
              access: { $ne: GameAccess.Private },
            },
            NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Games),
          ],
        },
      },
    };
  },
};
