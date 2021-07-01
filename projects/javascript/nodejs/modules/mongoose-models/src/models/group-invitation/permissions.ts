import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GroupInvitation, GroupInvitationDocument } from './model';

export const GroupInvitationPermissions = new MongoosePermissions<GroupInvitationDocument>(
  GroupInvitation,
  {
    create: {
      leader: ['fromUserId', 'groupId', 'toUserId'],
      'open-member': ['fromUserId', 'groupId', 'toUserId'],
    },
    delete: {
      recipient: true,
      sender: true,
    },
    find: {
      default: {
        $or: [{ fromUserId: { $ref: 'user._id' } }, { toUserId: { $ref: 'user._id' } }],
      },
    },
    populate: [{ path: 'groupDocument' }],
    read: {
      default: ['_id', 'createdAt', 'fromUserId', 'groupId', 'toUserId', 'updatedAt'],
    },
    roles: [
      {
        name: 'leader',
        query: {
          'record.groupDocument.isOpen': false,
          'record.groupDocument.userIds.0': { $ref: 'user._id' },
        },
      },
      {
        name: 'open-member',
        query: {
          'record.groupDocument.isOpen': true,
          'record.groupDocument.userIds': { $ref: 'user._id' },
        },
      },
      {
        name: 'sender',
        query: { 'record.fromUserId': { $ref: 'user._id' } },
      },
      {
        name: 'recipient',
        query: { 'record.toUserId': { $ref: 'user._id' } },
      },
    ],
  },
);
