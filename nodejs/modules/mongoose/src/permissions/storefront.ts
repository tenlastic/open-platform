import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, StorefrontDocument, StorefrontModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: [
    'background',
    'description',
    'icon',
    'images',
    'logo',
    'metadata.*',
    'namespaceId',
    'roles',
    'showGameServers',
    'showQueues',
    'subtitle',
    'title',
    'videos',
  ],
  read: [
    '_id',
    'background',
    'createdAt',
    'description',
    'icon',
    'images',
    'logo',
    'metadata.*',
    'namespaceId',
    'roles',
    'showGameServers',
    'showQueues',
    'subtitle',
    'title',
    'updatedAt',
    'videos',
  ],
  update: [
    'background',
    'description',
    'icon',
    'images',
    'logo',
    'metadata.*',
    'roles',
    'showGameServers',
    'showQueues',
    'subtitle',
    'title',
    'videos',
  ],
};

export const StorefrontPermissions = new MongoosePermissions<StorefrontDocument>(StorefrontModel, {
  create: {
    'namespace-write': administrator.create,
    'user-write': administrator.create,
  },
  delete: {
    'namespace-write': true,
    'user-write': true,
  },
  find: {
    default: AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.StorefrontsRead]),
    'user-read': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'background',
      'createdAt',
      'description',
      'icon',
      'images',
      'logo',
      'metadata.*',
      'namespaceId',
      'showGameServers',
      'showQueues',
      'subtitle',
      'title',
      'updatedAt',
      'videos',
    ],
    'namespace-read': administrator.read,
    'user-read': administrator.read,
  },
  roles: {
    default: {},
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.StorefrontsRead,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.StorefrontsWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.StorefrontsRead,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.StorefrontsWrite,
    ]),
  },
  update: {
    'namespace-write': administrator.update,
    'user-write': administrator.update,
  },
});
