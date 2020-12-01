import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { QueueLog, QueueLogDocument } from './model';

export const QueueLogPermissions = new MongoosePermissions<QueueLogDocument>(QueueLog, {
  create: {
    'namespace-administrator': ['body', 'queueId', 'unix'],
    'system-administrator': ['body', 'queueId', 'unix'],
  },
  find: {
    default: {
      queueId: {
        $in: {
          // Find Game Servers within returned Namespaces.
          $query: {
            model: 'QueueSchema',
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
                              roles: { $eq: 'queues' },
                              value: { $eq: { $ref: 'key' } },
                            },
                          },
                        },
                        {
                          users: {
                            $elemMatch: {
                              _id: { $eq: { $ref: 'user._id' } },
                              roles: { $eq: 'queues' },
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
  },
  populate: [
    {
      path: 'queueDocument',
      populate: {
        path: 'namespaceDocument',
      },
    },
  ],
  read: {
    default: ['_id', 'body', 'createdAt', 'queueId', 'unix', 'updatedAt'],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'queues' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.queueDocument.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'queues' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.queueDocument.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'queues' },
              },
            },
          },
        ],
      },
    },
  ],
});
