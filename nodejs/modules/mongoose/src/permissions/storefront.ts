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
    default: AuthorizationPermissionsHelpers.getFindQuery([
      AuthorizationRole.StorefrontsRead,
      AuthorizationRole.StorefrontsReadWrite,
    ]),
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
      AuthorizationRole.StorefrontsReadWrite,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.StorefrontsReadWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.StorefrontsRead,
      AuthorizationRole.StorefrontsReadWrite,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.StorefrontsReadWrite,
    ]),
  },
  update: {
    'namespace-write': administrator.update,
    'user-write': administrator.update,
  },
});
