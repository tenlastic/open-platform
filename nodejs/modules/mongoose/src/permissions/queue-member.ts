import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, QueueMemberDocument, QueueMemberModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

const admin = {
  create: ['groupId', 'namespaceId', 'queueId', 'userId'],
};

export const QueueMemberPermissions = new MongoosePermissions<QueueMemberDocument>(
  QueueMemberModel,
  {
    create: {
      'group-leader': admin.create,
      'namespace-write': admin.create,
      owner: ['namespaceId', 'queueId', 'userId'],
      'user-write': admin.create,
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
            AuthorizationRole.QueuesPlay,
            AuthorizationRole.QueuesRead,
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
        'team.*',
        'updatedAt',
        'userId',
        'userIds',
        'webSocketId',
      ],
      'system-read': [
        '_id',
        'createdAt',
        'groupId',
        'namespaceId',
        'queueId',
        'team.*',
        'updatedAt',
        'userId',
        'userIds',
        'webSocketId',
      ],
    },
    roles: {
      default: {},
      'group-leader': {
        ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([AuthorizationRole.QueuesPlay]),
        'record.groupDocument.members.0.userId': { $ref: 'user._id' },
      },
      'group-member': {
        ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([AuthorizationRole.QueuesPlay]),
        'record.groupDocument.members.userId': { $ref: 'user._id' },
      },
      'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.QueuesRead,
      ]),
      'namespace-write': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.QueuesWrite,
      ]),
      owner: {
        ...AuthorizationPermissionsHelpers.getNamespaceRoleQuery([AuthorizationRole.QueuesPlay]),
        'record.userId': { $ref: 'user._id' },
      },
      'system-read': AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.QueuesRead,
      ]),
      'system-write': AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.QueuesWrite,
      ]),
      'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.QueuesRead]),
      'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.QueuesWrite,
      ]),
    },
  },
);
