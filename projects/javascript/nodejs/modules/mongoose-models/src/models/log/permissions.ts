import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Log, LogDocument } from './model';

export const LogPermissions = new MongoosePermissions<LogDocument>(Log, {
  create: {
    roles: {
      'namespace-administrator': ['body', 'gameServerId', 'unix'],
      'system-administrator': ['body', 'gameServerId', 'unix'],
    },
  },
  find: {
    base: {
      gameServerId: {
        $in: {
          $query: {
            model: 'GameServerSchema',
            select: '_id',
            where: {
              gameId: {
                $in: {
                  // Find all Databases within the returned Namespaces.
                  $query: {
                    model: 'GameSchema',
                    select: '_id',
                    where: {
                      namespaceId: {
                        $in: {
                          // Find all Namespaces that the user is a member of.
                          $query: {
                            model: 'NamespaceSchema',
                            select: '_id',
                            where: {
                              'accessControlList.userId': { $eq: { $ref: 'user._id' } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  populate: [
    {
      path: 'gameServerDocument',
      populate: {
        path: 'gameDocument',
        populate: {
          path: 'namespaceDocument',
        },
      },
    },
  ],
  read: {
    base: ['_id', 'body', 'createdAt', 'gameServerId', 'unix', 'updatedAt'],
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'Administrator' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        'record.gameServerDocument.gameDocument.namespaceDocument.accessControlList': {
          $elemMatch: {
            roles: { $eq: 'Administrator' },
            userId: { $eq: { $ref: 'user._id' } },
          },
        },
      },
    },
  ],
});
