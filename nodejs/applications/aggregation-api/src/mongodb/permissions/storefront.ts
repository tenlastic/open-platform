import { AuthorizationRole } from '@tenlastic/mongoose';
import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Storefront, StorefrontDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const StorefrontPermissions = new MongoosePermissions<StorefrontDocument>(Storefront, {
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
});
