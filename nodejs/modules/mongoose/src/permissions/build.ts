import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, BuildDocument, BuildModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: ['entrypoint', 'name', 'namespaceId', 'platform', 'publishedAt', 'reference.*'],
  read: [
    '_id',
    'createdAt',
    'entrypoint',
    'files.*',
    'logs',
    'name',
    'namespaceId',
    'platform',
    'publishedAt',
    'reference.*',
    'status.*',
    'updatedAt',
  ],
  update: ['entrypoint', 'name', 'publishedAt'],
};

export const BuildPermissions = new MongoosePermissions<BuildDocument>(BuildModel, {
  create: {
    'namespace-write': administrator.create,
    'user-write': administrator.create,
  },
  delete: {
    'namespace-write': true,
    'user-write': true,
  },
  find: {
    default: {
      $or: [
        AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.BuildsRead]),
        {
          ...AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.BuildsReadPublished]),
          publishedAt: { $lte: new Date() },
        },
      ],
    },
    'user-read': {},
    'user-read-published': { publishedAt: { $lte: new Date() } },
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'createdAt',
      'entrypoint',
      'files.*',
      'name',
      'namespaceId',
      'platform',
      'publishedAt',
      'updatedAt',
    ],
    'namespace-read': administrator.read,
    'system-read': administrator.read,
    'user-read': administrator.read,
  },
  roles: {
    default: {},
    'namespace-read': {
      $or: [
        AuthorizationPermissionsHelpers.getNamespaceRoleQuery([AuthorizationRole.BuildsRead]),
        {
          ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
            AuthorizationRole.BuildsReadPublished,
          ]),
          publishedAt: { $exists: true },
        },
      ],
    },
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.BuildsWrite,
    ]),
    'system-read': {
      $or: [
        AuthorizationPermissionsHelpers.getSystemRoleQuery([AuthorizationRole.BuildsRead]),
        {
          ...AuthorizationPermissionsHelpers.getSystemRoleQuery([
            AuthorizationRole.BuildsReadPublished,
          ]),
          publishedAt: { $exists: true },
        },
      ],
    },
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.BuildsWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.BuildsRead]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.BuildsWrite]),
  },
  update: {
    'namespace-write': administrator.update,
    'system-write': [...administrator.update, 'files.*', 'status.*'],
    'user-write': administrator.update,
  },
});
