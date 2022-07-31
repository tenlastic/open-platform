import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationPermissionsHelpers, AuthorizationRole } from '../authorization';
import { Storefront, StorefrontDocument } from './model';

const administrator = {
  create: [
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

export const StorefrontPermissions = new MongoosePermissions<StorefrontDocument>(Storefront, {
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
    'user-write': {},
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
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.StorefrontsReadWrite,
      ]),
    },
    {
      name: 'namespace-write',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.StorefrontsReadWrite,
      ]),
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.StorefrontsRead,
        AuthorizationRole.StorefrontsReadWrite,
      ]),
    },
    {
      name: 'namespace-read',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.StorefrontsRead,
        AuthorizationRole.StorefrontsReadWrite,
      ]),
    },
  ],
  update: {
    'namespace-write': administrator.update,
    'user-write': administrator.update,
  },
});
