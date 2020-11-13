export const RecordPermissions = {
  create: {
    roles: {
      'namespace-administrator': ['collectionId', 'properties.*', 'userId'],
      'system-administrator': ['collectionId', 'properties.*', 'userId'],
    },
  },
  delete: {
    roles: {
      'namespace-administrator': true,
      'system-administrator': true,
    },
  },
  find: {
    base: {
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
    roles: {
      'system-administrator': {},
    },
  },
  populate: [
    {
      path: 'collectionDocument',
      populate: [{ path: 'namespaceDocument' }],
    },
  ],
  read: {
    roles: {
      'namespace-administrator': [
        '_id',
        'collectionId',
        'createdAt',
        'properties.*',
        'updatedAt',
        'userId',
      ],
      'system-administrator': [
        '_id',
        'collectionId',
        'createdAt',
        'properties.*',
        'updatedAt',
        'userId',
      ],
    },
  },
  roles: [
    {
      name: 'system-administrator',
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
    roles: {
      'namespace-administrator': ['collectionId', 'properties.*', 'userId'],
      'system-administrator': ['collectionId', 'properties.*', 'userId'],
    },
  },
};
