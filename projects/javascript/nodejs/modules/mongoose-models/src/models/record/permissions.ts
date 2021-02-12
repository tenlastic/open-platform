export const RecordPermissions = {
  create: {
    'namespace-administrator': ['collectionId', 'properties.*', 'userId'],
    'user-administrator': ['collectionId', 'properties.*', 'userId'],
  },
  delete: {
    'namespace-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: {
      collectionId: {
        $in: {
          // Find Collections within returned Namespace.
          $query: {
            model: 'CollectionSchema',
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
                              roles: { $eq: 'collections' },
                              value: { $eq: { $ref: 'key' } },
                            },
                          },
                        },
                        {
                          users: {
                            $elemMatch: {
                              _id: { $eq: { $ref: 'user._id' } },
                              roles: { $eq: 'collections' },
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
    'user-administrator': {},
  },
  populate: [
    {
      path: 'collectionDocument',
      populate: [{ path: 'namespaceDocument' }],
    },
  ],
  read: {
    'namespace-administrator': [
      '_id',
      'collectionId',
      'createdAt',
      'properties.*',
      'updatedAt',
      'userId',
    ],
    'user-administrator': [
      '_id',
      'collectionId',
      'createdAt',
      'properties.*',
      'updatedAt',
      'userId',
    ],
  },
  roles: [
    {
      name: 'user-administrator',
      query: {
        'user.roles': { $eq: 'collections' },
      },
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.collectionDocument.namespaceDocument.keys': {
              $elemMatch: {
                roles: { $eq: 'collections' },
                value: { $eq: { $ref: 'key' } },
              },
            },
          },
          {
            'record.collectionDocument.namespaceDocument.users': {
              $elemMatch: {
                _id: { $eq: { $ref: 'user._id' } },
                roles: { $eq: 'collections' },
              },
            },
          },
        ],
      },
    },
  ],
  update: {
    'namespace-administrator': ['collectionId', 'properties.*', 'userId'],
    'user-administrator': ['collectionId', 'properties.*', 'userId'],
  },
};
