import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Message, MessageDocument } from './model';

export const MessagePermissions = new MongoosePermissions<MessageDocument>(Message, {
  create: {
    roles: {
      sender: ['body', 'fromUserId', 'toUserId'],
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
        { toUserId: { $eq: { $ref: 'user._id' } } },
      ],
    },
  },
  read: {
    base: ['_id', 'body', 'createdAt', 'fromUserId', 'readAt', 'toUserId', 'updatedAt'],
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
      recipient: ['readAt'],
      sender: ['body', 'toUserId'],
    },
  },
});
