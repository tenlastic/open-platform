import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, TeamDocument, TeamModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const TeamPermissions = new MongoosePermissions<TeamDocument>(TeamModel, {
  delete: {
    'namespace-write': true,
    'user-write': true,
  },
  find: {
    default: AuthorizationPermissionsHelpers.getFindQuery([
      AuthorizationRole.TeamsPlay,
      AuthorizationRole.TeamsRead,
    ]),
    'user-read': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'createdAt',
      'metadata.*',
      'rating',
      'namespaceId',
      'queueId',
      'updatedAt',
      'userIds',
    ],
  },
  roles: {
    default: {},
    'namespace-play': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.TeamsPlay,
    ]),
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.TeamsRead,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.TeamsWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.TeamsRead]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.TeamsWrite]),
  },
  update: {
    'namespace-write': ['metadata.*', 'rating'],
    'user-write': ['metadata.*', 'rating'],
  },
});
