import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { BuildWorkflow, BuildWorkflowDocument } from './model';

export const BuildWorkflowPermissions = new MongoosePermissions<BuildWorkflowDocument>(
  BuildWorkflow,
  {
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
                        roles: { $eq: 'builds' },
                        value: { $eq: { $ref: 'key' } },
                      },
                    },
                  },
                  {
                    'record.namespaceDocument.users': {
                      $elemMatch: {
                        _id: { $eq: { $ref: 'user._id' } },
                        roles: { $eq: 'builds' },
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
        'buildId',
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
          'user.roles': { $eq: 'builds' },
        },
      },
      {
        name: 'namespace-administrator',
        query: {
          $or: [
            {
              'record.namespaceDocument.keys': {
                $elemMatch: {
                  roles: { $eq: 'builds' },
                  value: { $eq: { $ref: 'key' } },
                },
              },
            },
            {
              'record.namespaceDocument.users': {
                $elemMatch: {
                  _id: { $eq: { $ref: 'user._id' } },
                  roles: { $eq: 'builds' },
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
  },
);
