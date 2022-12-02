import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import {
  AuthorizationRequestDocument,
  AuthorizationRequestModel,
  AuthorizationRole,
} from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const AuthorizationRequestPermissions =
  new MongoosePermissions<AuthorizationRequestDocument>(AuthorizationRequestModel, {
    create: {
      'namespace-write': ['deniedAt', 'grantedAt', 'namespaceId', 'roles', 'userId'],
      owner: ['namespaceId', 'roles', 'userId'],
      'user-write': ['deniedAt', 'grantedAt', 'namespaceId', 'roles', 'userId'],
    },
    delete: {
      'namespace-write': true,
      owner: true,
      'user-write': true,
    },
    find: {
      default: {
        $or: [
          AuthorizationPermissionsHelpers.getFindQuery([
            AuthorizationRole.AuthorizationsRead,
            AuthorizationRole.AuthorizationsReadWrite,
          ]),
          { userId: { $ref: 'user._id' } },
        ],
      },
      'user-read': {},
    },
    populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
    read: {
      default: [
        '_id',
        'createdAt',
        'deniedAt',
        'grantedAt',
        'namespaceId',
        'roles',
        'updatedAt',
        'userId',
      ],
    },
    roles: {
      default: {},
      'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.AuthorizationsRead,
        AuthorizationRole.AuthorizationsReadWrite,
      ]),
      'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.AuthorizationsReadWrite,
      ]),
      owner: { 'record.userId': { $ref: 'user._id' } },
      'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.AuthorizationsRead,
        AuthorizationRole.AuthorizationsReadWrite,
      ]),
      'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.AuthorizationsReadWrite,
      ]),
    },
    update: {
      'namespace-write': ['deniedAt', 'grantedAt', 'roles'],
      owner: ['roles'],
      'user-write': ['deniedAt', 'grantedAt', 'roles'],
    },
  });
