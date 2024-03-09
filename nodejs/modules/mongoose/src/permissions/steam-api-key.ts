import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, SteamApiKeyDocument, SteamApiKeyModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: ['appId', 'name', 'namespaceId', 'value'],
  read: ['_id', 'appId', 'createdAt', 'name', 'namespaceId', 'updatedAt', 'value'],
  update: ['name'],
};

export const SteamApiKeyPermissions = new MongoosePermissions<SteamApiKeyDocument>(
  SteamApiKeyModel,
  {
    create: {
      'namespace-write': administrator.create,
      'user-write': administrator.create,
    },
    delete: {
      'namespace-write': true,
      'user-write': true,
    },
    find: {
      default: AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.SteamApiKeysRead]),
      'user-read': {},
    },
    populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
    read: {
      default: ['_id', 'appId', 'createdAt', 'name', 'namespaceId', 'updatedAt', 'value'],
      'namespace-read': administrator.read,
      'user-read': administrator.read,
    },
    roles: {
      default: {},
      'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.SteamApiKeysRead,
      ]),
      'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.SteamApiKeysWrite,
      ]),
      'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.SteamApiKeysRead,
      ]),
      'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.SteamApiKeysWrite,
      ]),
    },
    update: {
      'namespace-write': administrator.update,
      'user-write': administrator.update,
    },
  },
);
