import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { Collection, CollectionDocument } from './model';

export const CollectionPermissions = new MongoosePermissions<CollectionDocument>(Collection, {
  create: {
    'namespace-administrator': [
      'indexes.*',
      'jsonSchema.*',
      'name',
      'namespaceId',
      'permissions.*',
    ],
    'user-administrator': ['indexes.*', 'jsonSchema.*', 'name', 'namespaceId', 'permissions.*'],
  },
  delete: {
    'namespace-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Collections),
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
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
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Collections),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Collections),
    },
  ],
  update: {
    'namespace-administrator': ['indexes.*', 'jsonSchema.*', 'name', 'permissions.*'],
    'user-administrator': ['indexes.*', 'jsonSchema.*', 'name', 'permissions.*'],
  },
});
