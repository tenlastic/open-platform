import { IOptions, MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { AuthorizationRole, CollectionDocument, RecordDocument, RecordModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: ['collectionId', 'namespaceId', 'properties.*', 'userId'],
  read: ['_id', 'collectionId', 'createdAt', 'namespaceId', 'properties.*', 'updatedAt', 'userId'],
  update: ['properties.*', 'userId'],
};

export function RecordPermissions(collection: CollectionDocument, Model: RecordModel) {
  const permissions: IOptions = {
    create: {
      ...collection.permissions.create,
      'namespace-write': administrator.create,
      'user-write': administrator.create,
    },
    delete: {
      ...collection.permissions.delete,
      'namespace-write': true,
      'user-write': true,
    },
    find: {
      ...collection.permissions.find,
      default: AuthorizationPermissionsHelpers.getFindQuery([
        AuthorizationRole.RecordsRead,
        AuthorizationRole.RecordsReadWrite,
      ]),
      'user-read': {},
    },
    populate: collection.permissions.populate
      ? [...collection.permissions.populate, AuthorizationPermissionsHelpers.getPopulateQuery()]
      : [AuthorizationPermissionsHelpers.getPopulateQuery()],
    read: {
      ...collection.permissions.read,
      'namespace-read': administrator.read,
      'user-read': administrator.read,
    },
    roles: {
      ...collection.permissions.roles,
      default: {},
      'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.RecordsRead,
        AuthorizationRole.RecordsReadWrite,
      ]),
      'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.RecordsReadWrite,
      ]),
      'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.RecordsRead,
        AuthorizationRole.RecordsReadWrite,
      ]),
      'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.RecordsReadWrite,
      ]),
    },
    update: {
      ...collection.permissions.update,
      'namespace-write': administrator.update,
      'user-write': administrator.update,
    },
  };

  return new MongoosePermissions<RecordDocument>(Model, permissions);
}
