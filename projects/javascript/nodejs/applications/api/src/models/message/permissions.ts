import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Message, MessageDocument } from './model';

export const MessagePermissions = new MongoosePermissions<MessageDocument>(Message, {
  create: {
    roles: {
      sender: ['body', 'fromUserId', 'toGroupId', 'toUserId'],
    },
  },
  delete: {
    roles: {
      sender: true,
    },
  },
  find: {
    base: {
      $or: [
        { fromUserId: { $eq: { $ref: 'user._id' } } },
        {
          toGroupId: {
            $in: {
              // Find Groups of which the User is a member.
              $query: {
                model: 'GroupSchema',
                select: '_id',
                where: {
                  userIds: { $eq: { $ref: 'user._id' } },
                },
              },
            },
          },
        },
        { toUserId: { $eq: { $ref: 'user._id' } } },
      ],
    },
  },
  read: {
    base: [
      '_id',
      'body',
      'createdAt',
      'fromUserId',
      'readByUserIds',
      'toGroupId',
      'toUserId',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'sender',
      query: {
        'record.fromUserId': { $eq: { $ref: 'user._id' } },
      },
    },
    {
      name: 'recipient',
      query: {
        'record.toUserId': { $eq: { $ref: 'user._id' } },
      },
    },
  ],
  update: {
    roles: {
      sender: ['body'],
    },
  },
});
