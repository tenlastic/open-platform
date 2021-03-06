import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { GamePermissionsHelpers } from '../game';

import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { Build, BuildDocument } from './model';

const administrator = {
  create: ['entrypoint', 'gameId', 'name', 'namespaceId', 'platform', 'publishedAt', 'reference.*'],
  read: [
    '_id',
    'createdAt',
    'entrypoint',
    'files.*',
    'gameId',
    'name',
    'namespaceId',
    'platform',
    'publishedAt',
    'reference.*',
    'status.*',
    'updatedAt',
  ],
};

export const BuildPermissions = new MongoosePermissions<BuildDocument>(Build, {
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
        NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Builds),
        {
          gameId: { $in: GamePermissionsHelpers.getAuthorizedGameIds() },
          publishedAt: { $exists: true, $ne: null },
        },
        { gameId: null, publishedAt: { $exists: true, $ne: null } },
        { gameId: { $exists: false }, publishedAt: { $exists: true, $ne: null } },
      ],
    },
    'system-administrator': {},
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'createdAt',
      'entrypoint',
      'files.*',
      'gameId',
      'name',
      'namespaceId',
      'platform',
      'publishedAt',
      'updatedAt',
    ],
    'namespace-administrator': administrator.read,
    'system-administrator': administrator.read,
    'user-administrator': administrator.read,
  },
  roles: [
    {
      name: 'system-administrator',
      query: { 'user.roles': UserRole.Builds, 'user.system': true },
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Builds),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Builds),
    },
  ],
  update: {
    'namespace-administrator': ['entrypoint', 'gameId', 'name', 'publishedAt'],
    'system-administrator': ['files.*', 'status.*'],
    'user-administrator': ['entrypoint', 'gameId', 'name', 'publishedAt'],
  },
});
