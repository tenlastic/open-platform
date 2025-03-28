import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, GroupInvitationDocument, GroupInvitationModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const GroupInvitationPermissions = new MongoosePermissions<GroupInvitationDocument>(
  GroupInvitationModel,
  {
    create: {
      'namespace-write': ['fromUserId', 'groupId', 'toUserId'],
      leader: ['fromUserId', 'groupId', 'toUserId'],
      'user-write': ['fromUserId', 'groupId', 'toUserId'],
    },
    delete: {
      'namespace-write': true,
      recipient: true,
      sender: true,
      'user-write': true,
    },
    find: {
      default: AuthorizationPermissionsHelpers.getFindQuery([
        AuthorizationRole.GroupsPlay,
        AuthorizationRole.GroupsRead,
      ]),
      'user-read': {},
    },
    populate: [AuthorizationPermissionsHelpers.getPopulateQuery(), { path: 'groupDocument' }],
    read: {
      default: [
        '_id',
        'createdAt',
        'expiresAt',
        'fromUserId',
        'groupId',
        'namespaceId',
        'toUserId',
        'updatedAt',
      ],
    },
    roles: {
      default: {},
      leader: {
        ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([AuthorizationRole.GroupsPlay]),
        'record.groupDocument.members.0.userId': { $ref: 'user._id' },
      },
      'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.GroupsRead,
      ]),
      'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.GroupsWrite,
      ]),
      recipient: {
        ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([AuthorizationRole.GroupsPlay]),
        'record.toUserId': { $ref: 'user._id' },
      },
      sender: {
        ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([AuthorizationRole.GroupsPlay]),
        'record.fromUserId': { $ref: 'user._id' },
      },
      'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.GroupsRead]),
      'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.GroupsWrite,
      ]),
    },
  },
);
