import { IOptions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, GroupDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const GroupPermissionOptions: IOptions<GroupDocument> = {
  create: {
    'group-leader-write': ['namespaceId'],
    'namespace-write': ['namespaceId'],
    'user-write': ['namespaceId'],
  },
  delete: {
    'group-leader-write': true,
    'namespace-write': true,
    'user-write': true,
  },
  find: {
    default: AuthorizationPermissionsHelpers.getFindQuery([
      AuthorizationRole.GroupsPlay,
      AuthorizationRole.GroupsRead,
    ]),
    'user-read': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: ['_id', 'createdAt', 'namespaceId', 'updatedAt', 'userId', 'userIds'],
  },
  roles: {
    default: {},
    'group-leader-write': {
      ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.GroupsPlay,
        AuthorizationRole.GroupsWrite,
      ]),
      'record.userId': { $ref: 'user._id' },
    },
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.GroupsRead,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.GroupsWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.GroupsRead]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.GroupsWrite]),
  },
  update: {
    'group-leader-write': ['userId'],
  },
};
