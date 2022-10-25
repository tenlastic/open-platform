import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Group, GroupDocument } from '../models';

export const GroupPermissions = new MongoosePermissions<GroupDocument>(Group, {
  create: {
    default: ['isOpen'],
  },
  delete: {
    leader: true,
  },
  find: {
    default: {},
  },
  read: {
    default: ['_id', 'createdAt', 'isOpen', 'updatedAt', 'userIds'],
  },
  roles: [
    {
      name: 'leader',
      query: { 'record.userIds.0': { $ref: 'user._id' } },
    },
    {
      name: 'member',
      query: { 'record.userIds': { $ref: 'user._id' } },
    },
  ],
  update: {
    leader: ['isOpen'],
  },
});
