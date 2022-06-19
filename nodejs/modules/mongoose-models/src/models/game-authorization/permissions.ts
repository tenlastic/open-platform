import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { GameAuthorization, GameAuthorizationDocument, GameAuthorizationStatus } from './model';

export const GameAuthorizationPermissions = new MongoosePermissions<GameAuthorizationDocument>(
  GameAuthorization,
  {
    create: {
      'namespace-administrator': ['gameId', 'namespaceId', 'status', 'userId'],
      owner: ['gameId', 'namespaceId', 'userId'],
      'user-administrator': ['gameId', 'namespaceId', 'status', 'userId'],
    },
    delete: {
      'namespace-administrator': true,
      owner: true,
      'user-administrator': true,
    },
    find: {
      default: {
        $or: [
          NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Games),
          { userId: { $ref: 'user._id' } },
        ],
      },
      'user-administrator': {},
    },
    populate: [{ path: 'namespaceDocument' }],
    read: {
      default: ['_id', 'createdAt', 'gameId', 'namespaceId', 'status', 'updatedAt', 'userId'],
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
      {
        name: 'owner',
        query: {
          'record.status': GameAuthorizationStatus.Pending,
          'record.userId': { $ref: 'user._id' },
        },
      },
    ],
    update: {
      'namespace-administrator': ['status'],
      'user-administrator': ['status'],
    },
  },
);
