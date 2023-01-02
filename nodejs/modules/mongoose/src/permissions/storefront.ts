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
    'subtitle',
    'title',
    'videos',
  ],
  update: [
    'background',
    'description',
    'icon',
    'images',
    'logo',
    'metadata.*',
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
      'subtitle',
      'title',
      'updatedAt',
      'videos',
    ],
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
