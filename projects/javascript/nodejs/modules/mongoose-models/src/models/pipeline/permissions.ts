import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Pipeline, PipelineDocument } from './model';

export const PipelinePermissions = new MongoosePermissions<PipelineDocument>(Pipeline, {
  create: {
    'namespace-administrator': [
      'isPreemptible',
      'name',
      'namespaceId',
      'pipelineTemplateId',
      'spec.*',
    ],
    'system-administrator': [
      'isPreemptible',
      'name',
      'namespaceId',
      'pipelineTemplateId',
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
    default: [
      '_id',
      'createdAt',
      'isPreemptible',
      'name',
      'namespaceId',
      'pipelineTemplateId',
      'spec.*',
      'status.*',
      'updatedAt',
    ],
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
});
