import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { WorkflowLog, WorkflowLogDocument } from './model';

export const WorkflowLogPermissions = new MongoosePermissions<WorkflowLogDocument>(WorkflowLog, {
  create: {
    'system-administrator': ['body', 'nodeId', 'unix', 'workflowId'],
  },
  find: {
    default: {
      workflowId: {
        $in: {
          // Find Game Servers within returned Namespaces.
          $query: {
            model: 'WorkflowSchema',
            select: '_id',
            where: {
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
          },
        },
      },
    },
    'system-administrator': {},
    'user-administrator': {},
  },
  populate: [
    {
      path: 'workflowDocument',
      populate: {
        path: 'namespaceDocument',
      },
    },
  ],
  read: {
    default: ['_id', 'body', 'createdAt', 'expiresAt', 'nodeId', 'unix', 'updatedAt', 'workflowId'],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'workflows' },
        'user.system': { $eq: true },
      },
    },
    {
      name: 'user-administrator',
      query: {
        'user.roles': { $eq: 'workflows' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.workflowDocument.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'workflows' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.workflowDocument.namespaceDocument.users': {
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
});
