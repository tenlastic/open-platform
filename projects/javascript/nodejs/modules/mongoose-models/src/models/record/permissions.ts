import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';

export const RecordPermissions = {
  create: {
    'namespace-administrator': [
      'collectionId',
      'databaseId',
      'namespaceId',
      'properties.*',
      'userId',
    ],
    'user-administrator': ['collectionId', 'databaseId', 'namespaceId', 'properties.*', 'userId'],
  },
  delete: {
    'namespace-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Databases),
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    'namespace-administrator': [
      '_id',
      'collectionId',
      'createdAt',
      'databaseId',
      'namespaceId',
      'properties.*',
      'updatedAt',
      'userId',
    ],
    'user-administrator': [
      '_id',
      'collectionId',
      'createdAt',
      'databaseId',
      'namespaceId',
      'properties.*',
      'updatedAt',
      'userId',
    ],
  },
  roles: [
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Databases),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Databases),
    },
  ],
  update: {
    'namespace-administrator': ['properties.*', 'userId'],
    'user-administrator': ['properties.*', 'userId'],
  },
};
