import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GamePermissionsHelpers } from '../game';
import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { QueueMember, QueueMemberDocument } from './model';

export const QueueMemberPermissions = new MongoosePermissions<QueueMemberDocument>(QueueMember, {
  create: {
    'group-leader': ['groupId', 'queueId', 'webSocketId'],
    'namespace-administrator': ['groupId', 'queueId', 'userId', 'webSocketId'],
    owner: ['queueId', 'userId', 'webSocketId'],
    'user-administrator': ['groupId', 'queueId', 'userId', 'webSocketId'],
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
        {
          queueId: {
            $in: {
              // Find all Queues within the returned Namespaces.
              $query: {
                model: 'QueueSchema',
                select: '_id',
                where: {
                  namespaceId: {
                    $in: NamespacePermissionsHelpers.getNamespaceIdsByRole(NamespaceRole.Queues),
                  },
                },
              },
            },
          },
        },
        {
          queueId: {
            $in: {
              // Find all Queues associated with the returned Games.
              $query: {
                model: 'QueueSchema',
                select: '_id',
                where: { gameId: { $in: GamePermissionsHelpers.getAuthorizedGameIds() } },
              },
            },
          },
        },
        { userIds: { $eq: { $ref: 'user._id' } } },
      ],
    },
    'system-administrator': {},
    'user-administrator': {},
  },
  populate: [
    { path: 'groupDocument' },
    {
      path: 'queueDocument',
      populate: [{ path: 'namespaceDocument' }],
    },
  ],
  read: {
    default: ['_id', 'createdAt', 'groupId', 'queueId', 'updatedAt', 'userId', 'userIds'],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'queues' },
        'user.system': { $eq: true },
      },
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Queues),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(
        'record.queueDocument.namespaceDocument',
        NamespaceRole.Queues,
      ),
    },
    {
      name: 'group-leader',
      query: { 'record.groupDocument.userIds.0': { $eq: { $ref: 'user._id' } } },
    },
    {
      name: 'owner',
      query: { 'record.userId': { $eq: { $ref: 'user._id' } } },
    },
  ],
});
