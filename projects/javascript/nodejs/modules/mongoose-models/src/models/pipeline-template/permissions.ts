import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { PipelineTemplate, PipelineTemplateDocument } from './model';

export const PipelineTemplatePermissions = new MongoosePermissions<PipelineTemplateDocument>(
  PipelineTemplate,
  {
    create: {
      'namespace-administrator': ['namespaceId', 'pipelineTemplate.*'],
      'system-administrator': ['namespaceId', 'pipelineTemplate.*'],
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
                        roles: { $eq: 'pipelines' },
                        value: { $eq: { $ref: 'key' } },
                      },
                    },
                  },
                  {
                    users: {
                      $elemMatch: {
                        _id: { $eq: { $ref: 'user._id' } },
                        roles: { $eq: 'pipelines' },
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
      default: ['_id', 'createdAt', 'namespaceId', 'pipelineTemplate.*', 'updatedAt'],
    },
    roles: [
      {
        name: 'system-administrator',
        query: {
          'user.roles': { $eq: 'pipelines' },
        },
      },
      {
        name: 'namespace-administrator',
        query: {
          $or: [
            {
              'record.namespaceDocument.keys': {
                $elemMatch: {
                  roles: { $eq: 'pipelines' },
                  value: { $eq: { $ref: 'key' } },
                },
              },
            },
            {
              'record.namespaceDocument.users': {
                $elemMatch: {
                  _id: { $eq: { $ref: 'user._id' } },
                  roles: { $eq: 'pipelines' },
                },
              },
            },
          ],
        },
      },
    ],
    update: {
      'namespace-administrator': ['pipelineTemplate.*'],
      'system-administrator': ['pipelineTemplate.*'],
    },
  },
);
