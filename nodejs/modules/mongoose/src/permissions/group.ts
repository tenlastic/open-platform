import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { GroupDocument, GroupModel } from '../models';

export const GroupPermissions = new MongoosePermissions<GroupDocument>(GroupModel, {
  create: {
    default: ['open', 'name'],
  },
  delete: {
    leader: true,
  },
  find: {
    default: {},
  },
  read: {
    default: ['_id', 'createdAt', 'open', 'name', 'updatedAt', 'userIds'],
  },
  roles: {
    default: {},
    leader: { 'record.userIds.0': { $ref: 'user._id' } },
    member: { 'record.userIds': { $ref: 'user._id' } },
  },
  update: {
    leader: ['open', 'name'],
  },
});
