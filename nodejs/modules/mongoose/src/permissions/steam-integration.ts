import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, SteamIntegrationDocument, SteamIntegrationModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: ['apiKey', 'applicationId', 'name', 'namespaceId', 'roles'],
  read: [
    '_id',
    'apiKey',
    'applicationId',
    'createdAt',
    'name',
    'namespaceId',
    'roles',
    'updatedAt',
  ],
  update: ['name', 'roles'],
};

export const SteamIntegrationPermissions = new MongoosePermissions<SteamIntegrationDocument>(
  SteamIntegrationModel,
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
      default: AuthorizationPermissionsHelpers.getFindQuery([
        AuthorizationRole.SteamIntegrationsRead,
      ]),
      'user-read': {},
    },
    populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
    read: {
      default: administrator.read,
      'namespace-read': administrator.read,
      'user-read': administrator.read,
    },
    roles: {
      default: {},
      'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.SteamIntegrationsRead,
      ]),
      'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.SteamIntegrationsWrite,
      ]),
      'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.SteamIntegrationsRead,
      ]),
      'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.SteamIntegrationsWrite,
      ]),
    },
    update: {
      'namespace-write': administrator.update,
      'user-write': administrator.update,
    },
  },
);
