import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, QueueMember, QueueMemberDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const QueueMemberPermissions = new MongoosePermissions<QueueMemberDocument>(QueueMember, {
  create: {
    'group-leader': ['groupId', 'namespaceId', 'queueId', 'userId', 'webSocketId'],
    'namespace-write': ['groupId', 'namespaceId', 'queueId', 'userId', 'webSocketId'],
    owner: ['namespaceId', 'queueId', 'userId', 'webSocketId'],
    'user-write': ['groupId', 'namespaceId', 'queueId', 'userId', 'webSocketId'],
  },
  delete: {
    'group-leader': true,
    'group-member': true,
    'namespace-write': true,
    owner: true,
    'system-write': true,
    'user-write': true,
  },
  find: {
    default: {
      $or: [
        AuthorizationPermissionsHelpers.getFindQuery([
          AuthorizationRole.QueuesRead,
          AuthorizationRole.QueuesReadWrite,
        ]),
        { userId: { $ref: 'user._id' } },
      ],
    },
    'user-read': {},
  },
  populate: [{ path: 'groupDocument' }, AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: [
      '_id',
      'createdAt',
      'groupId',
      'namespaceId',
      'queueId',
      'updatedAt',
      'userId',
      'userIds',
    ],
  },
  roles: {
    default: {},
    'group-leader': { 'record.groupDocument.userIds.0': { $ref: 'user._id' } },
    'group-member': { 'record.groupDocument.userIds': { $ref: 'user._id' } },
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.QueuesRead,
      AuthorizationRole.QueuesReadWrite,
    ]),
    'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.QueuesReadWrite,
    ]),
    owner: { 'record.userId': { $ref: 'user._id' } },
    'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.QueuesRead,
      AuthorizationRole.QueuesReadWrite,
    ]),
    'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
      AuthorizationRole.QueuesReadWrite,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.QueuesRead,
      AuthorizationRole.QueuesReadWrite,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.QueuesReadWrite,
    ]),
  },
});
