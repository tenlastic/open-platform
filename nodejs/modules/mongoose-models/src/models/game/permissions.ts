import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationStatus } from '../authorization';
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
    'metadata.*',
    'namespaceId',
    'subtitle',
    'title',
    'videos',
  ],
  update: [
    'access',
    'background',
    'description',
    'icon',
    'images',
    'metadata.*',
    'subtitle',
    'title',
    'videos',
  ],
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
          access: GameAccess.Private,
          namespaceId: {
            $in: {
              $query: {
                model: 'AuthorizationSchema',
                select: 'namespaceId',
                where: {
                  status: AuthorizationStatus.Granted,
                  userId: { $ref: 'user._id' },
                },
              },
            },
          },
        },
        {
          access: { $ne: GameAccess.Private },
          namespaceId: {
            $nin: {
              $query: {
                model: 'AuthorizationSchema',
                select: 'namespaceId',
                where: {
                  status: AuthorizationStatus.Revoked,
                  userId: { $ref: 'user._id' },
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
      'access',
      'background',
      'createdAt',
      'description',
      'icon',
      'images',
      'metadata.*',
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
  getAuthorizedNamespaceIds() {
    return {
      $query: {
        model: 'GameSchema',
        select: 'namespaceId',
        where: {
          $or: [
            {
              access: GameAccess.Private,
              namespaceId: {
                $in: {
                  $query: {
                    model: 'AuthorizationSchema',
                    select: 'namespaceId',
                    where: {
                      status: AuthorizationStatus.Granted,
                      userId: { $ref: 'user._id' },
                    },
                  },
                },
              },
            },
            {
              access: { $ne: GameAccess.Private },
              namespaceId: {
                $nin: {
                  $query: {
                    model: 'AuthorizationSchema',
                    select: 'namespaceId',
                    where: {
                      status: AuthorizationStatus.Revoked,
                      userId: { $ref: 'user._id' },
                    },
                  },
                },
              },
            },
            NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Games),
          ],
        },
      },
    };
  },
};
