import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, MatchInvitationDocument, MatchInvitationModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  read: [
    '_id',
    'acceptedAt',
    'createdAt',
    'expiresAt',
    'matchId',
    'namespaceId',
    'queueId',
    'updatedAt',
    'userId',
  ],
};

export const MatchInvitationPermissions = new MongoosePermissions<MatchInvitationDocument>(
  MatchInvitationModel,
  {
    delete: {
      'namespace-write': true,
      recipient: true,
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
          { userId: { $ref: 'user._id' } },
        ],
      },
      'user-read': {},
    },
    populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
    read: {
      default: [
        '_id',
        'acceptedAt',
        'createdAt',
        'expiresAt',
        'namespaceId',
        'queueId',
        'updatedAt',
        'userId',
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
      recipient: { 'record.userId': { $ref: 'user._id' } },
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
      recipient: ['acceptedAt'],
    },
  },
);
