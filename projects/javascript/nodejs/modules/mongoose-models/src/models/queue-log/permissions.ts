import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { QueueLog, QueueLogDocument } from './model';

export const QueueLogPermissions = new MongoosePermissions<QueueLogDocument>(QueueLog, {
  create: {
    'system-administrator': ['body', 'namespaceId', 'nodeId', 'queueId', 'unix'],
  },
  find: {
    default: NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Queues),
    'system-administrator': {},
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'body',
      'createdAt',
      'expiresAt',
      'namespaceId',
      'nodeId',
      'queueId',
      'unix',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: { 'user.roles': UserRole.Queues, 'user.system': true },
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Queues),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Queues),
    },
  ],
});
