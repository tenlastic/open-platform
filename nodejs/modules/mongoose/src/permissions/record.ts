import { IOptions, MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { ReturnModelType } from '@typegoose/typegoose';

import { AuthorizationRole, CollectionDocument, RecordDocument, RecordSchema } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: ['collectionId', 'namespaceId', 'properties.*', 'userId'],
  read: ['_id', 'collectionId', 'createdAt', 'namespaceId', 'properties.*', 'updatedAt', 'userId'],
  update: ['properties.*', 'userId'],
};

export function RecordPermissions(
  collection: CollectionDocument,
  Model: ReturnModelType<typeof RecordSchema>,
) {
  const permissions: IOptions = {
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
      default: AuthorizationPermissionsHelpers.getFindQuery([
        AuthorizationRole.RecordsRead,
        AuthorizationRole.RecordsReadWrite,
      ]),
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
      ...Object.fromEntries(collection.permissions?.update || []),
      'namespace-write': administrator.update,
      'user-write': administrator.update,
    },
  };

  return new MongoosePermissions<RecordDocument>(Model, permissions);
}
