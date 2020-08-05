import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Group, GroupDocument } from './model';

export const GroupPermissions = new MongoosePermissions<GroupDocument>(Group, {
  create: {
    base: ['isOpen'],
  },
  delete: {
    roles: {
      leader: true,
    },
  },
  find: {
    base: {},
  },
  read: {
    base: ['_id', 'createdAt', 'isOpen', 'updatedAt', 'userCount', 'userIds'],
  },
  roles: [
    {
      name: 'leader',
      query: {
        'record.userIds.0': { $eq: { $ref: 'user._id' } },
      },
    },
    {
      name: 'member',
      query: {
        'record.userIds': { $eq: { $ref: 'user._id' } },
      },
    },
  ],
  update: {
    roles: {
      leader: ['isOpen'],
    },
  },
});
