import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, Storefront, StorefrontDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const StorefrontPermissions = new MongoosePermissions<StorefrontDocument>(Storefront, {
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
      'logo',
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
});
