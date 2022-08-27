import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, Build, BuildDocument } from '../models';
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
          publishedAt: { $ne: null },
        },
      ],
    },
    'user-read': {},
    'user-read-published': { publishedAt: { $ne: null } },
    'user-write': {},
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
    'namespace-write': administrator.read,
    'system-read': administrator.read,
    'system-write': administrator.read,
    'user-read': administrator.read,
    'user-write': administrator.read,
  },
  roles: [
    {
      name: 'system-write',
      query: AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.BuildsReadWrite,
      ]),
    },
    {
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.BuildsReadWrite]),
    },
    {
      name: 'namespace-write',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.BuildsReadWrite,
      ]),
    },
    {
      name: 'system-read',
      query: {
        $or: [
          AuthorizationPermissionsHelpers.getSystemRoleQuery([
            AuthorizationRole.BuildsRead,
            AuthorizationRole.BuildsReadWrite,
          ]),
          {
            ...AuthorizationPermissionsHelpers.getSystemRoleQuery([
              AuthorizationRole.BuildsReadPublished,
            ]),
            publishedAt: { $ne: null },
          },
        ],
      },
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.BuildsRead,
        AuthorizationRole.BuildsReadWrite,
      ]),
    },
    {
      name: 'namespace-read',
      query: {
        $or: [
          AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
            AuthorizationRole.BuildsRead,
            AuthorizationRole.BuildsReadWrite,
          ]),
          {
            ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
              AuthorizationRole.BuildsReadPublished,
            ]),
            publishedAt: { $ne: null },
          },
        ],
      },
    },
  ],
  update: {
    'namespace-write': ['entrypoint', 'name', 'publishedAt'],
    'system-write': ['files.*', 'status.*'],
    'user-write': ['entrypoint', 'name', 'publishedAt'],
  },
});
