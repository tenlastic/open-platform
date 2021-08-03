import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { Workflow, WorkflowDocument } from './model';

const administrator = {
  create: [
    'cpu',
    'memory',
    'name',
    'namespaceId',
    'preemptible',
    'spec.arguments.*',
    'spec.entrypoint',
    'spec.parallelism',
    'spec.templates.dag.*',
    'spec.templates.inputs.*',
    'spec.templates.name',
    'spec.templates.retryStrategy.*',
    'spec.templates.script.args',
    'spec.templates.script.command',
    'spec.templates.script.env.name',
    'spec.templates.script.env.value',
    'spec.templates.script.image',
    'spec.templates.script.resources.*',
    'spec.templates.script.source',
    'spec.templates.script.workingDir',
    'spec.templates.script.workspace',
    'spec.templates.sidecars.args',
    'spec.templates.sidecars.command',
    'spec.templates.sidecars.env.name',
    'spec.templates.sidecars.env.value',
    'spec.templates.sidecars.image',
    'spec.templates.sidecars.name',
    'spec.templates.sidecars.resources.*',
    'storage',
  ],
};

export const WorkflowPermissions = new MongoosePermissions<WorkflowDocument>(Workflow, {
  create: {
    'namespace-administrator': administrator.create,
    'user-administrator': administrator.create,
  },
  delete: {
    'namespace-administrator': true,
    'user-administrator': true,
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
      'cpu',
      'createdAt',
      'logs',
      'memory',
      'name',
      'namespaceId',
      'preemptible',
      'spec.*',
      'status.*',
      'storage',
      'updatedAt',
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
  update: {
    'system-administrator': ['finishedAt', 'status.*'],
  },
});
