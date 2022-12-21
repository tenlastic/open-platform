import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, CollectionDocument, CollectionModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const CollectionPermissions = new MongoosePermissions<CollectionDocument>(CollectionModel, {
  create: {
    'namespace-write': ['indexes.*', 'jsonSchema.*', 'name', 'namespaceId', 'permissions.*'],
    'user-write': ['indexes.*', 'jsonSchema.*', 'name', 'namespaceId', 'permissions.*'],
  },
  delete: {
    'namespace-write': true,
    'user-write': true,
  },
  find: {
    default: AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.CollectionsRead]),
    'user-read': {},
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
  roles: {
    default: {},
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.CollectionsRead,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.CollectionsWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.CollectionsRead,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.CollectionsWrite,
    ]),
  },
  update: {
    'namespace-write': ['indexes.*', 'jsonSchema.*', 'name', 'permissions.*'],
    'user-write': ['indexes.*', 'jsonSchema.*', 'name', 'permissions.*'],
  },
});
