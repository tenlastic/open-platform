import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { BuildLog, BuildLogDocument } from './model';

export const BuildLogPermissions = new MongoosePermissions<BuildLogDocument>(BuildLog, {
  create: {
    'system-administrator': ['body', 'buildId', 'nodeId', 'unix'],
  },
  find: {
    default: {
      buildId: {
        $in: {
          // Find Game Servers within returned Namespaces.
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
                          keys: {
                            $elemMatch: {
                              roles: { $eq: 'builds' },
                              value: { $eq: { $ref: 'key' } },
                            },
                          },
                        },
                        {
                          users: {
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
      populate: {
        path: 'namespaceDocument',
      },
    },
  ],
  read: {
    default: ['_id', 'body', 'buildId', 'createdAt', 'expiresAt', 'nodeId', 'unix', 'updatedAt'],
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
});
