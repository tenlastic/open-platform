import { AuthorizationPermissionsHelpers, AuthorizationRole } from '../authorization';

const administrator = {
  create: ['collectionId', 'namespaceId', 'properties.*', 'userId'],
  read: ['_id', 'collectionId', 'createdAt', 'namespaceId', 'properties.*', 'updatedAt', 'userId'],
  update: ['properties.*', 'userId'],
};

export const RecordPermissions = {
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
      AuthorizationRole.CollectionsRead,
      AuthorizationRole.CollectionsReadWrite,
    ]),
    'user-read': {},
    'user-write': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    'namespace-read': administrator.read,
    'namespace-write': administrator.read,
    'user-read': administrator.read,
    'user-write': administrator.read,
  },
  roles: [
    {
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
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
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.CollectionsRead,
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
    'namespace-write': administrator.update,
    'user-write': administrator.update,
  },
};
