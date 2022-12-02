import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { MessageDocument, MessageModel } from '../models';

export const MessagePermissions = new MongoosePermissions<MessageDocument>(MessageModel, {
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
  roles: {
    default: {},
    recipient: { 'record.toUserId': { $ref: 'user._id' } },
    sender: { 'record.fromUserId': { $ref: 'user._id' } },
  },
  update: {
    sender: ['body'],
  },
});
