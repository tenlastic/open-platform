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

  Object.assign(permissions.create, collection.permissions.create);
  Object.assign(permissions.delete, collection.permissions.delete);
  Object.assign(permissions.read, collection.permissions.read);
  Object.assign(permissions.update, collection.permissions.update);

  if (collection.permissions.find) {
    const find = JSON.parse(JSON.stringify(collection.permissions.find));

    Object.keys(permissions.find).forEach((key) => {
      if (key in find) {
        find[key] = { $or: [find[key], permissions.find[key]] };
      }
    });

    Object.assign(permissions.find, find);
  }
  if (collection.permissions.populate) {
    permissions.populate.push(...collection.permissions.populate);
  }
  if (collection.permissions.roles) {
    permissions.roles.push(...collection.permissions.roles);
  }

  return new MongoosePermissions<RecordDocument>(Model, permissions);
}
