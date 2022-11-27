import { AuthorizationRole } from '@tenlastic/mongoose';
import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Build, BuildDocument } from '../models';
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
};

export const BuildPermissions = new MongoosePermissions<BuildDocument>(Build, {
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
        AuthorizationPermissionsHelpers.getFindQuery([
          AuthorizationRole.BuildsRead,
          AuthorizationRole.BuildsReadWrite,
        ]),
        {
          ...AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.BuildsReadPublished]),
          publishedAt: { $exists: true, $ne: null },
        },
      ],
    },
    'user-read': {},
    'user-read-published': { publishedAt: { $exists: true, $ne: null } },
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
        AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
          AuthorizationRole.BuildsRead,
          AuthorizationRole.BuildsReadWrite,
        ]),
        {
          ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
            AuthorizationRole.BuildsReadPublished,
          ]),
          publishedAt: { $exists: true, $ne: null },
        },
      ],
    },
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.BuildsReadWrite,
    ]),
    'system-read': {
      $or: [
        AuthorizationPermissionsHelpers.getSystemRoleQuery([
          AuthorizationRole.BuildsRead,
          AuthorizationRole.BuildsReadWrite,
        ]),
        {
          ...AuthorizationPermissionsHelpers.getSystemRoleQuery([
            AuthorizationRole.BuildsReadPublished,
          ]),
          publishedAt: { $exists: true, $ne: null },
        },
      ],
    },
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.BuildsReadWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.BuildsRead,
      AuthorizationRole.BuildsReadWrite,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.BuildsReadWrite,
    ]),
  },
  update: {
    'namespace-write': ['entrypoint', 'name', 'publishedAt'],
    'system-write': ['files.*', 'status.*'],
    'user-write': ['entrypoint', 'name', 'publishedAt'],
  },
});
