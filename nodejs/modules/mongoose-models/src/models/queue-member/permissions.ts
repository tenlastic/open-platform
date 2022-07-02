import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GamePermissionsHelpers } from '../game';
import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { QueueMember, QueueMemberDocument } from './model';

export const QueueMemberPermissions = new MongoosePermissions<QueueMemberDocument>(QueueMember, {
  create: {
    'group-leader': ['groupId', 'namespaceId', 'queueId', 'userId', 'webSocketId'],
    'namespace-administrator': ['groupId', 'namespaceId', 'queueId', 'userId', 'webSocketId'],
    owner: ['namespaceId', 'queueId', 'userId', 'webSocketId'],
    'user-administrator': ['groupId', 'namespaceId', 'queueId', 'userId', 'webSocketId'],
  },
  delete: {
    'group-leader': true,
    'namespace-administrator': true,
    owner: true,
    'system-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: {
      $or: [
        NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Queues),
        NamespacePermissionsHelpers.getNamespaceUserFindQuery(NamespaceRole.Queues),
        {
          queueId: {
            $in: {
              // Find all Queues associated with the returned Games.
              $query: {
                model: 'QueueSchema',
                select: '_id',
                where: { namespaceId: { $in: GamePermissionsHelpers.getAuthorizedNamespaceIds() } },
              },
            },
          },
        },
        { userIds: { $ref: 'user._id' } },
      ],
    },
    'user-administrator': {},
  },
  populate: [{ path: 'groupDocument' }, { path: 'namespaceDocument' }],
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
      name: 'system-administrator',
      query: NamespacePermissionsHelpers.getNamespaceUserRoleQuery(NamespaceRole.Queues),
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Queues),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Queues),
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
