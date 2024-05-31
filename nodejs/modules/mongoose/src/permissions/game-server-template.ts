import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, GameServerTemplateDocument, GameServerTemplateModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: [
    'buildId',
    'cpu',
    'description',
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'ports.*',
    'preemptible',
    'probes.*',
    'secrets.*',
  ],
  read: [
    '_id',
    'buildId',
    'cpu',
    'createdAt',
    'description',
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'ports.*',
    'preemptible',
    'probes.*',
    'secrets.*',
    'updatedAt',
  ],
  update: [
    'buildId',
    'cpu',
    'description',
    'memory',
    'metadata.*',
    'name',
    'ports.*',
    'preemptible',
    'probes.*',
    'secrets.*',
  ],
};

export const GameServerTemplatePermissions = new MongoosePermissions<GameServerTemplateDocument>(
  GameServerTemplateModel,
  {
    create: {
      'namespace-write': administrator.create,
      'system-write': administrator.create,
      'user-write': administrator.create,
    },
    delete: {
      'namespace-write': true,
      'system-write': true,
      'user-write': true,
    },
    find: {
      default: AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.GameServersRead]),
      'user-read': {},
    },
    populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
    read: {
      default: [
        '_id',
        'createdAt',
        'description',
        'metadata.*',
        'name',
        'namespaceId',
        'updatedAt',
      ],
      'namespace-read': administrator.read,
      'system-read': administrator.read,
      'user-read': administrator.read,
    },
    roles: {
      default: {},
      'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.GameServersRead,
      ]),
      'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.GameServersWrite,
      ]),
      'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.GameServersRead,
      ]),
      'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.GameServersWrite,
      ]),
      'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.GameServersRead,
      ]),
      'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.GameServersWrite,
      ]),
    },
    update: {
      'namespace-write': administrator.update,
      'system-write': administrator.update,
      'user-write': administrator.update,
    },
  },
);
