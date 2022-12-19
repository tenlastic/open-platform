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
      default: AuthorizationPermissionsHelpers.getFindQuery([
        AuthorizationRole.GameServersRead,
        AuthorizationRole.GameServersReadWrite,
      ]),
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
        AuthorizationRole.GameServersReadWrite,
      ]),
      'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.GameServersReadWrite,
      ]),
      'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.GameServersRead,
        AuthorizationRole.GameServersReadWrite,
      ]),
      'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.GameServersReadWrite,
      ]),
      'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.GameServersRead,
        AuthorizationRole.GameServersReadWrite,
      ]),
      'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.GameServersReadWrite,
      ]),
    },
    update: {
      'namespace-write': administrator.update,
      'system-write': administrator.update,
      'user-write': administrator.update,
    },
  },
);
