import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, MatchDocument, MatchModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: ['confirmationExpiresAt', 'namespaceId', 'queueId', 'teams.*'],
  read: [
    '_id',
    'confirmationExpiresAt',
    'confirmedUserIds',
    'createdAt',
    'finishedAt',
    'namespaceId',
    'queueId',
    'startedAt',
    'teams.*',
    'updatedAt',
  ],
  update: ['queueId', 'teams.*'],
};

export const MatchPermissions = new MongoosePermissions<MatchDocument>(MatchModel, {
  create: {
    'namespace-write': administrator.create,
    'user-write': administrator.create,
  },
  delete: {
    'namespace-write': true,
    'system-write': true,
    'user-write': true,
  },
  find: {
    default: {
      $or: [
        AuthorizationPermissionsHelpers.getFindQuery([
          AuthorizationRole.MatchesRead,
          AuthorizationRole.MatchesReadWrite,
        ]),
        { startedAt: { $exists: true }, 'teams.userIds': { $ref: 'user._id' } },
      ],
    },
    'user-read': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'confirmationExpiresAt',
      'confirmedUserIds',
      'createdAt',
      'finishedAt',
      'namespaceId',
      'queueId',
      'startedAt',
      'teams.*',
      'updatedAt',
    ],
    'namespace-read': administrator.read,
    'system-read': administrator.read,
    'user-read': administrator.read,
  },
  roles: {
    default: {},
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.MatchesRead,
      AuthorizationRole.MatchesReadWrite,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.MatchesReadWrite,
    ]),
    'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.MatchesRead,
      AuthorizationRole.MatchesReadWrite,
    ]),
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.MatchesReadWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.MatchesRead,
      AuthorizationRole.MatchesReadWrite,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.MatchesReadWrite,
    ]),
  },
  update: {
    'namespace-write': administrator.update,
    'system-write': ['queueId', 'teams.*'],
    'user-write': administrator.update,
  },
});
