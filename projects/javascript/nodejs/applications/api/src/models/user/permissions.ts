import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { User, UserDocument } from './model';

export const UserPermissions = new MongoosePermissions<UserDocument>(User, {
  create: {
    base: ['email', 'password', 'username'],
    roles: {
      administrator: ['roles'],
    },
  },
  delete: {
    base: false,
    roles: {
      administrator: true,
      self: true,
    },
  },
  find: {
    base: {},
  },
  read: {
    base: ['_id', 'createdAt', 'username', 'updatedAt'],
    roles: {
      administrator: ['email', 'roles'],
      self: ['email', 'roles'],
    },
  },
  roles: [
    { name: 'administrator', query: { 'user.roles': { $eq: 'Administrator' } } },
    { name: 'self', query: { 'record._id': { $eq: { $ref: 'user._id' } } } },
  ],
  update: {
    base: [],
    roles: {
      administrator: ['email', 'roles', 'password', 'username'],
      self: ['email', 'password', 'username'],
    },
  },
});
