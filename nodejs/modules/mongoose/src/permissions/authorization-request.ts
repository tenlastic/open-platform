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
          AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.AuthorizationsRead]),
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
      ]),
      'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.AuthorizationsWrite,
      ]),
      owner: { 'record.userId': { $ref: 'user._id' } },
      'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.AuthorizationsRead,
      ]),
      'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.AuthorizationsWrite,
      ]),
    },
    update: {
      'namespace-write': ['deniedAt', 'grantedAt'],
      owner: ['roles'],
      'user-write': ['deniedAt', 'grantedAt'],
    },
  });
