import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationPermissionsHelpers, AuthorizationRole } from '../authorization';
import { Collection, CollectionDocument } from './model';

export const CollectionPermissions = new MongoosePermissions<CollectionDocument>(Collection, {
  create: {
    'namespace-write': ['indexes.*', 'jsonSchema.*', 'name', 'namespaceId', 'permissions.*'],
    'user-write': ['indexes.*', 'jsonSchema.*', 'name', 'namespaceId', 'permissions.*'],
  },
  delete: {
    'namespace-write': true,
    'user-write': true,
  },
  find: {
    default: AuthorizationPermissionsHelpers.getFindQuery([
      AuthorizationRole.CollectionsRead,
      AuthorizationRole.CollectionsReadWrite,
    ]),
    'user-read': {},
    'user-write': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'createdAt',
      'indexes.*',
      'jsonSchema.*',
      'name',
      'namespaceId',
      'permissions.*',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.CollectionsReadWrite,
      ]),
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.CollectionsRead,
        AuthorizationRole.CollectionsReadWrite,
      ]),
    },
    {
      name: 'namespace-write',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.CollectionsReadWrite,
      ]),
    },
    {
      name: 'namespace-read',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.CollectionsRead,
        AuthorizationRole.CollectionsReadWrite,
      ]),
    },
  ],
  update: {
    'namespace-write': ['indexes.*', 'jsonSchema.*', 'name', 'permissions.*'],
    'user-write': ['indexes.*', 'jsonSchema.*', 'name', 'permissions.*'],
  },
});
