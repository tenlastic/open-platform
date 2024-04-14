import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, MatchDocument, MatchModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: ['gameServerTemplateId', 'invitationsExpireAt', 'namespaceId', 'teams.*'],
  read: [
    '_id',
    'acceptedUserIds',
    'createdAt',
    'declinedUserIds',
    'finishedAt',
    'gameServerTemplateId',
    'invitationSeconds',
    'invitationsExpireAt',
    'namespaceId',
    'queueId',
    'startedAt',
    'teams.*',
    'updatedAt',
  ],
  update: ['teams.*'],
};

export const MatchPermissions = new MongoosePermissions<MatchDocument>(MatchModel, {
  create: {
    'namespace-write': administrator.create,
    'system-write': [...administrator.create, 'queueId'],
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
        AuthorizationPermissionsHelpers.getFindQuery([AuthorizationRole.MatchesRead]),
        {
          acceptedUserIds: { $ref: 'user._id' },
          startedAt: { $exists: true },
          'teams.userIds': { $ref: 'user._id' },
        },
      ],
    },
    'user-read': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'acceptedUserIds',
      'createdAt',
      'declinedUserIds',
      'finishedAt',
      'gameServerTemplateId',
      'invitationSeconds',
      'invitationsExpireAt',
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
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.MatchesWrite,
    ]),
    'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.MatchesRead,
    ]),
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.MatchesWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.MatchesRead]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.MatchesWrite,
    ]),
  },
  update: {
    'namespace-write': administrator.update,
    'system-write': [...administrator.update, 'teams.*'],
    'user-write': administrator.update,
  },
});
