import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { WorkflowLog, WorkflowLogDocument } from './model';

export const WorkflowLogPermissions = new MongoosePermissions<WorkflowLogDocument>(WorkflowLog, {
  create: {
    'system-administrator': ['body', 'namespaceId', 'nodeId', 'unix', 'workflowId'],
  },
  find: {
    default: NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Workflows),
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
      'unix',
      'updatedAt',
      'workflowId',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: { 'user.roles': UserRole.Workflows, 'user.system': true },
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Workflows),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Workflows),
    },
  ],
});
