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
    'user-write': {},
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
  roles: [
    {
      name: 'system-write',
      query: AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.QueuesReadWrite,
      ]),
    },
    {
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.QueuesReadWrite]),
    },
    {
      name: 'namespace-write',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.QueuesReadWrite,
      ]),
    },
    {
      name: 'system-read',
      query: AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.QueuesRead,
        AuthorizationRole.QueuesReadWrite,
      ]),
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.QueuesRead,
        AuthorizationRole.QueuesReadWrite,
      ]),
    },
    {
      name: 'namespace-read',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.QueuesRead,
        AuthorizationRole.QueuesReadWrite,
      ]),
    },
    {
      name: 'group-leader',
      query: { 'record.groupDocument.userIds.0': { $ref: 'user._id' } },
    },
    {
      name: 'owner',
      query: { 'record.userId': { $ref: 'user._id' } },
    },
  ],
});
