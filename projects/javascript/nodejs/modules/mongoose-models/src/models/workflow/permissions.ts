import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Workflow, WorkflowDocument } from './model';

export const WorkflowPermissions = new MongoosePermissions<WorkflowDocument>(Workflow, {
  create: {
    'namespace-administrator': [
      'isPreemptible',
      'name',
      'namespaceId',
      'workflowTemplateId',
      'spec.*',
    ],
    'system-administrator': [
      'isPreemptible',
      'name',
      'namespaceId',
      'workflowTemplateId',
      'spec.*',
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
                  keys: {
                    $elemMatch: {
                      roles: { $eq: 'workflows' },
                      value: { $eq: { $ref: 'key' } },
                    },
                  },
                },
                {
                  users: {
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
      'workflowTemplateId',
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
