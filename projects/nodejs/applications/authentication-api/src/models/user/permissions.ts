import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { User, UserDocument } from './model';

export const UserPermissions = new MongoosePermissions<UserDocument>(User, {
  create: {
    base: ['email', 'password', 'username'],
    roles: {
      admin: ['roles'],
    },
  },
  delete: {
    base: false,
    roles: {
      admin: true,
      self: true,
    },
  },
  find: {
    base: {},
  },
  read: {
    base: ['_id', 'createdAt', 'username', 'updatedAt'],
    roles: {
      admin: ['email', 'roles'],
      self: ['email', 'roles'],
    },
  },
  roles: [
    { name: 'admin', query: { 'user.roles': { $eq: 'Admin' } } },
    { name: 'self', query: { 'record._id': { $eq: { $ref: 'user._id' } } } },
  ],
  update: {
    base: [],
    roles: {
      admin: ['email', 'roles', 'password', 'username'],
      self: ['email', 'password', 'username'],
    },
  },
});
