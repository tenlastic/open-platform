import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Database, DatabaseDocument } from './model';

const administrator = {
  create: ['cpu', 'gameId', 'memory', 'name', 'namespaceId', 'preemptible', 'replicas', 'storage'],
  read: [
    '_id',
    'cpu',
    'createdAt',
    'gameId',
    'memory',
    'name',
    'namespaceId',
    'preemptible',
    'replicas',
    'status.*',
    'storage',
    'updatedAt',
  ],
  update: ['cpu', 'gameId', 'memory', 'name', 'preemptible', 'replicas', 'storage'],
};

export const DatabasePermissions = new MongoosePermissions<DatabaseDocument>(Database, {
  create: {
    'namespace-administrator': administrator.create,
    'system-administrator': administrator.create,
    'user-administrator': administrator.create,
  },
  delete: {
    'namespace-administrator': true,
    'system-administrator': true,
    'user-administrator': true,
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
                      roles: { $eq: 'databases' },
                      value: { $eq: { $ref: 'key' } },
                    },
                  },
                },
                {
                  users: {
                    $elemMatch: {
                      _id: { $eq: { $ref: 'user._id' } },
                      roles: { $eq: 'databases' },
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
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'createdAt',
      'description',
      'gameId',
      'name',
      'namespaceId',
      'status.phase',
      'teams',
      'updatedAt',
      'usersPerTeam',
    ],
    'namespace-administrator': administrator.read,
    'system-administrator': administrator.read,
    'user-administrator': administrator.read,
  },
  roles: [
    {
      name: 'system-administrator',
      query: {
        'user.roles': { $eq: 'databases' },
        'user.system': { $eq: true },
      },
    },
    {
      name: 'user-administrator',
      query: {
        'user.roles': { $eq: 'databases' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'databases' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'databases' },
              },
            },
          },
        ],
      },
    },
  ],
  update: {
    'namespace-administrator': administrator.update,
    'system-administrator': [
      'cpu',
      'gameId',
      'memory',
      'name',
      'preemptible',
      'replicas',
      'status.*',
      'storage',
    ],
    'user-administrator': administrator.update,
  },
});
