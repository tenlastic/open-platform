import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GroupInvitation, GroupInvitationDocument } from './model';

export const GroupInvitationPermissions = new MongoosePermissions<GroupInvitationDocument>(
  GroupInvitation,
  {
    create: {
      roles: {
        leader: ['groupId', 'toUserId'],
        'open-member': ['groupId', 'toUserId'],
      },
    },
    delete: {
      roles: {
        recipient: true,
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
    populate: [{ path: 'groupDocument' }],
    read: {
      base: ['_id', 'createdAt', 'fromUserId', 'groupId', 'toUserId', 'updatedAt'],
    },
    roles: [
      {
        name: 'leader',
        query: {
          'record.groupDocument.isOpen': { $eq: false },
          'record.groupDocument.userIds.0': { $eq: { $ref: 'user._id' } },
        },
      },
      {
        name: 'open-member',
        query: {
          'record.groupDocument.isOpen': { $eq: true },
          'record.groupDocument.userIds': { $eq: { $ref: 'user._id' } },
        },
      },
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
  },
);