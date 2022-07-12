import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationPermissionsHelpers, AuthorizationRole } from '../authorization';
import { Game, GameDocument } from './model';

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
    'namespace-write': administrator.create,
    'user-write': administrator.create,
  },
  delete: {
    'namespace-write': true,
    'user-write': true,
  },
  find: {
    default: AuthorizationPermissionsHelpers.getFindQuery([
      AuthorizationRole.GamesRead,
      AuthorizationRole.GamesReadWrite,
    ]),
    'user-read': {},
    'user-write': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
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
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.GamesReadWrite]),
    },
    {
      name: 'namespace-write',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.GamesReadWrite,
      ]),
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.GamesRead,
        AuthorizationRole.GamesReadWrite,
      ]),
    },
    {
      name: 'namespace-read',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.GamesRead,
        AuthorizationRole.GamesReadWrite,
      ]),
    },
  ],
  update: {
    'namespace-write': administrator.update,
    'user-write': administrator.update,
  },
});
