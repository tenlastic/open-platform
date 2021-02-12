import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { BuildWorkflow, BuildWorkflowDocument } from './model';

export const BuildWorkflowPermissions = new MongoosePermissions<BuildWorkflowDocument>(
  BuildWorkflow,
  {
    find: {
      default: {
        buildId: {
          $in: {
            // Find Builds in returned Namespaces.
            $query: {
              model: 'BuildSchema',
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
            },
          },
        },
      },
      'system-administrator': {},
      'user-administrator': {},
    },
    populate: [
      {
        path: 'buildDocument',
        populate: [{ path: 'namespaceDocument' }],
      },
    ],
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
          'user.system': { $eq: true },
        },
      },
      {
        name: 'user-administrator',
        query: {
          'user.roles': { $eq: 'builds' },
        },
      },
      {
        name: 'namespace-administrator',
        query: {
          $or: [
            {
              'record.buildDocument.namespaceDocument.keys': {
                $elemMatch: {
                  roles: { $eq: 'builds' },
                  value: { $eq: { $ref: 'key' } },
                },
              },
            },
            {
              'record.buildDocument.namespaceDocument.users': {
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
      'system-administrator': ['status.*'],
    },
  },
);
