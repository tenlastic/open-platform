import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, GroupDocument, GroupModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const GroupPermissions = new MongoosePermissions<GroupDocument>(GroupModel, {
  create: {
    'namespace-write': ['namespaceId'],
    leader: ['namespaceId'],
    'user-write': ['namespaceId'],
  },
  delete: {
    'namespace-write': true,
    leader: true,
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
    default: ['_id', 'createdAt', 'members.*', 'namespaceId', 'updatedAt'],
  },
  roles: {
    default: {},
    leader: {
      ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([AuthorizationRole.GroupsPlay]),
      'record.members.0.userId': { $ref: 'user._id' },
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
});
