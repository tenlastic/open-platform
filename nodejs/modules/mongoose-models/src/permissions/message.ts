import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Message, MessageDocument } from '../models';

export const MessagePermissions = new MongoosePermissions<MessageDocument>(Message, {
  create: {
    sender: ['body', 'fromUserId', 'toGroupId', 'toUserId'],
  },
  delete: {
    sender: true,
  },
  find: {
    default: {
      $or: [
        { fromUserId: { $ref: 'user._id' } },
        {
          toGroupId: {
            $in: {
              // Find Groups of which the User is a member.
              $query: {
                model: 'GroupSchema',
                select: '_id',
                where: {
                  userIds: { $ref: 'user._id' },
                },
              },
            },
          },
        },
        { toUserId: { $ref: 'user._id' } },
      ],
    },
  },
  populate: [{ path: 'toGroupDocument' }],
  read: {
    default: [
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
        'record.fromUserId': { $ref: 'user._id' },
        'record.toGroupId': { $exists: false },
        'record.toUserId': { $exists: true },
      },
    },
    {
      name: 'sender',
      query: {
        'record.fromUserId': { $ref: 'user._id' },
        'record.toGroupDocument.userIds': { $ref: 'user._id' },
        'record.toUserId': { $exists: false },
      },
    },
    {
      name: 'recipient',
      query: { 'record.toUserId': { $ref: 'user._id' } },
    },
  ],
  update: {
    sender: ['body'],
  },
});
