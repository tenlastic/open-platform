import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Workflow, WorkflowDocument } from './model';

export const WorkflowPermissions = new MongoosePermissions<WorkflowDocument>(Workflow, {
  create: {
    'namespace-administrator': [
      'isPreemptible',
      'name',
      'namespaceId',
      'spec.arguments.*',
      'spec.entrypoint',
      'spec.parallelism',
      'spec.templates.dag.*',
      'spec.templates.inputs.*',
      'spec.templates.name',
      'spec.templates.retryStrategy.*',
      'spec.templates.script.args',
      'spec.templates.script.command',
      'spec.templates.script.env.*',
      'spec.templates.script.image',
      'spec.templates.script.resources.*',
      'spec.templates.script.source',
      'spec.templates.script.workingDir',
      'spec.templates.script.workspace',
      'spec.templates.sidecars.*',
    ],
    'system-administrator': [
      'isPreemptible',
      'name',
      'namespaceId',
      'spec.arguments.*',
      'spec.entrypoint',
      'spec.parallelism',
      'spec.templates.dag.*',
      'spec.templates.inputs.*',
      'spec.templates.name',
      'spec.templates.retryStrategy.*',
      'spec.templates.script.args',
      'spec.templates.script.command',
      'spec.templates.script.env.*',
      'spec.templates.script.image',
      'spec.templates.script.resources.*',
      'spec.templates.script.source',
      'spec.templates.script.workingDir',
      'spec.templates.script.workspace',
      'spec.templates.sidecars.*',
    ],
  },
  delete: {
    'namespace-administrator': true,
    'system-administrator': true,
  },
  find: {
    default: {
      namespaceId: {
        $in: {
          // Find Namespaces where the Key or User has administrator access.
          $query: {
            model: 'NamespaceSchema',
            select: '_id',
            where: {
              $or: [
                {
                  'record.namespaceDocument.keys': {
                    $elemMatch: {
                      roles: { $eq: 'workflows' },
                      value: { $eq: { $ref: 'key' } },
                    },
                  },
                },
                {
                  'record.namespaceDocument.users': {
                    $elemMatch: {
                      _id: { $eq: { $ref: 'user._id' } },
                      roles: { $eq: 'workflows' },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    'system-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'createdAt',
      'isPreemptible',
      'name',
      'namespaceId',
      'spec.*',
      'status.*',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'workflows' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'workflows' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'workflows' },
              },
            },
          },
        ],
      },
    },
  ],
  update: {
    'namespace-administrator': ['status.*'],
    'system-administrator': ['status.*'],
  },
});
