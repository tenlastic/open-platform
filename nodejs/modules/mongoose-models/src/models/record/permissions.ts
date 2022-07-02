import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';

export const RecordPermissions = {
  create: {
    'namespace-administrator': ['collectionId', 'namespaceId', 'properties.*', 'userId'],
    'user-administrator': ['collectionId', 'namespaceId', 'properties.*', 'userId'],
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
    'namespace-administrator': [
      '_id',
      'collectionId',
      'createdAt',
      'namespaceId',
      'properties.*',
      'updatedAt',
      'userId',
    ],
    'user-administrator': [
      '_id',
      'collectionId',
      'createdAt',
      'namespaceId',
      'properties.*',
      'updatedAt',
      'userId',
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
    'namespace-administrator': ['properties.*', 'userId'],
    'user-administrator': ['properties.*', 'userId'],
  },
};
