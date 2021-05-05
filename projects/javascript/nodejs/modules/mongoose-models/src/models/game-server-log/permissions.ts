import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { GameServerLog, GameServerLogDocument } from './model';

export const GameServerLogPermissions = new MongoosePermissions<GameServerLogDocument>(
  GameServerLog,
  {
    create: {
      'system-administrator': ['body', 'gameServerId', 'namespaceId', 'unix'],
    },
    find: {
      default: NamespacePermissionsHelpers.getFindQuery(NamespaceRole.GameServers),
      'system-administrator': {},
      'user-administrator': {},
    },
    populate: [{ path: 'namespaceDocument' }],
    read: {
      default: [
        '_id',
        'body',
        'createdAt',
        'expiresAt',
        'gameServerId',
        'namespaceId',
        'unix',
        'updatedAt',
      ],
    },
    roles: [
      {
        name: 'system-administrator',
        query: { 'user.roles': UserRole.GameServers, 'user.system': true },
      },
      {
        name: 'user-administrator',
        query: UserPermissionsHelpers.getRoleQuery(UserRole.GameServers),
      },
      {
        name: 'namespace-administrator',
        query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.GameServers),
      },
    ],
  },
);
