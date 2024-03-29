import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GroupInvitationDocument, GroupInvitationModel } from '../models';

export const GroupInvitationPermissions = new MongoosePermissions<GroupInvitationDocument>(
  GroupInvitationModel,
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
      default: ['_id', 'createdAt', 'expiresAt', 'fromUserId', 'groupId', 'toUserId', 'updatedAt'],
    },
    roles: {
      default: {},
      leader: {
        'record.groupDocument.open': { $exists: false },
        'record.groupDocument.userIds.0': { $ref: 'user._id' },
      },
      'open-member': {
        'record.groupDocument.open': true,
        'record.groupDocument.userIds': { $ref: 'user._id' },
      },
      recipient: { 'record.toUserId': { $ref: 'user._id' } },
      sender: { 'record.fromUserId': { $ref: 'user._id' } },
    },
  },
);
