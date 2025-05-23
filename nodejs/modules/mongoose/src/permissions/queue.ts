import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, QueueDocument, QueueModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const administrator = {
  create: [
    'buildId',
    'confirmation',
    'cpu',
    'description',
    'gameServerTemplateId',
    'groupSizes',
    'initialRating',
    'invitationSeconds',
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'preemptible',
    'replicas',
    'restartedAt',
    'teams',
    'thresholds.*',
  ],
  read: [
    '_id',
    'buildId',
    'confirmation',
    'cpu',
    'createdAt',
    'description',
    'gameServerTemplateId',
    'groupSizes',
    'initialRating',
    'invitationSeconds',
    'memory',
    'metadata.*',
    'name',
    'namespaceId',
    'preemptible',
    'replicas',
    'restartedAt',
    'status.*',
    'teams',
    'thresholds.*',
    'updatedAt',
  ],
  update: [
    'buildId',
    'confirmation',
    'cpu',
    'description',
    'gameServerTemplateId',
    'groupSizes',
    'initialRating',
    'invitationSeconds',
    'memory',
    'metadata.*',
    'name',
    'preemptible',
    'replicas',
    'restartedAt',
    'teams',
    'thresholds.*',
  ],
};

export const QueuePermissions = new MongoosePermissions<QueueDocument>(QueueModel, {
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
    default: AuthorizationPermissionsHelpers.getFindQuery([
      AuthorizationRole.QueuesPlay,
      AuthorizationRole.QueuesRead,
    ]),
    'user-read': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'confirmation',
      'createdAt',
      'description',
      'initialRating',
      'invitationSeconds',
      'groupSizes',
      'metadata.*',
      'name',
      'namespaceId',
      'status.phase',
      'teams',
      'thresholds.*',
      'updatedAt',
    ],
    'namespace-logs': ['logs'],
    'namespace-read': administrator.read,
    'system-logs': ['logs'],
    'system-read': administrator.read,
    'user-logs': ['logs'],
    'user-read': administrator.read,
  },
  roles: {
    default: {},
    'namespace-logs': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.QueueLogsRead,
    ]),
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.QueuesPlay,
      AuthorizationRole.QueuesRead,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.QueuesWrite,
    ]),
    'system-logs': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.QueueLogsRead,
    ]),
    'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.QueuesRead,
    ]),
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.QueuesWrite,
    ]),
    'user-logs': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.QueueLogsRead,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.QueuesRead]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.QueuesWrite]),
  },
  update: {
    'namespace-write': administrator.update,
    'system-write': [...administrator.update, 'status.*'],
    'user-write': administrator.update,
  },
});
