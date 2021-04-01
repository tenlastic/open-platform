export const RecordPermissions = {
  create: {
    'namespace-administrator': ['collectionId', 'databaseId', 'properties.*', 'userId'],
    'user-administrator': ['collectionId', 'databaseId', 'properties.*', 'userId'],
  },
  delete: {
    'namespace-administrator': true,
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
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    'namespace-administrator': [
      '_id',
      'collectionId',
      'createdAt',
      'databaseId',
      'namespaceId',
      'properties.*',
      'updatedAt',
      'userId',
    ],
    'user-administrator': [
      '_id',
      'collectionId',
      'createdAt',
      'databaseId',
      'namespaceId',
      'properties.*',
      'updatedAt',
      'userId',
    ],
  },
  roles: [
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
    'namespace-administrator': ['properties.*', 'userId'],
    'user-administrator': ['properties.*', 'userId'],
  },
};
