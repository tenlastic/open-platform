import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationPermissionsHelpers, AuthorizationRole } from '../authorization';
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
    'namespace-write': administrator.create,
    'user-write': administrator.create,
  },
  delete: {
    'namespace-write': true,
    'user-write': true,
  },
  find: {
    default: AuthorizationPermissionsHelpers.getFindQuery([
      AuthorizationRole.WorkflowsRead,
      AuthorizationRole.WorkflowsReadWrite,
    ]),
    'user-read': {},
    'user-write': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
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
      name: 'system-write',
      query: AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.WorkflowsReadWrite,
      ]),
    },
    {
      name: 'system-read',
      query: AuthorizationPermissionsHelpers.getSystemRoleQuery([
        AuthorizationRole.WorkflowsRead,
        AuthorizationRole.WorkflowsReadWrite,
      ]),
    },
    {
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.WorkflowsReadWrite,
      ]),
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.WorkflowsRead,
        AuthorizationRole.WorkflowsReadWrite,
      ]),
    },
    {
      name: 'namespace-write',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.WorkflowsReadWrite,
      ]),
    },
    {
      name: 'namespace-read',
      query: AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
        AuthorizationRole.WorkflowsRead,
        AuthorizationRole.WorkflowsReadWrite,
      ]),
    },
  ],
  update: {
    'system-write': ['finishedAt', 'status.*'],
  },
});
