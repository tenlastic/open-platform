import { AuthorizationRole, CollectionDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: ['collectionId', 'namespaceId', 'properties.*', 'userId'],
  read: ['_id', 'collectionId', 'createdAt', 'namespaceId', 'properties.*', 'updatedAt', 'userId'],
  update: ['properties.*', 'userId'],
};

export function getRecordPermissionOptions(collection: CollectionDocument) {
  return {
    create: {
      ...Object.fromEntries(collection.permissions?.create || []),
      'namespace-write': administrator.create,
      'user-write': administrator.create,
    },
    delete: {
      ...Object.fromEntries(collection.permissions?.delete || []),
      'namespace-write': true,
      'user-write': true,
    },
    find: {
      ...Object.fromEntries(collection.permissions?.find || []),
      default: AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.RecordsRead]),
      'user-read': {},
    },
    populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
    read: {
      ...Object.fromEntries(collection.permissions?.read || []),
      'namespace-read': administrator.read,
      'user-read': administrator.read,
    },
    roles: {
      ...Object.fromEntries(collection.permissions?.roles || []),
      default: {},
      'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.RecordsRead,
      ]),
      'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.RecordsWrite,
      ]),
      'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.RecordsRead,
      ]),
      'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.RecordsWrite,
      ]),
    },
    update: {
      ...Object.fromEntries(collection.permissions?.update || []),
      'namespace-write': administrator.update,
      'user-write': administrator.update,
    },
  };
}
