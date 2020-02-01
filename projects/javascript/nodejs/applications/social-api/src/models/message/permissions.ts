import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Message, MessageDocument } from './model';

export const MessagePermissions = new MongoosePermissions<MessageDocument>(Message, {
  create: {
    roles: {
      sender: ['body', 'fromUserId', 'toUserIds'],
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
        { toUserIds: { $eq: { $ref: 'user._id' } } },
      ],
    },
  },
  read: {
    base: ['_id', 'body', 'createdAt', 'fromUserId', 'toUserIds', 'updatedAt'],
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
        'record.toUserIds': { $eq: { $ref: 'user._id' } },
      },
    },
  ],
  update: {
    roles: {
      sender: ['body', 'toUserId'],
    },
  },
});
