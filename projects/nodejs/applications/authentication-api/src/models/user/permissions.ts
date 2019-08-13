import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { User } from './model';

export const UserPermissions = new MongoosePermissions(User, {
  create: {
    base: ['email', 'password', 'username'],
    roles: {
      admin: ['activatedAt', 'roles'],
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
    roles: {
      default: { activatedAt: { $ne: null } },
    },
  },
  read: {
    base: ['_id', 'createdAt', 'username', 'updatedAt'],
    roles: {
      admin: ['activatedAt', 'email', 'roles'],
      self: ['email', 'roles'],
    },
  },
  roles: [
    { name: 'admin', query: { 'user.roles': { $eq: 'Admin' } } },
    { name: 'self', query: { 'record._id': { $eq: 'user._id' } } },
  ],
  update: {
    base: [],
    roles: {
      admin: ['activatedAt', 'email', 'roles', 'password', 'username'],
      self: ['email', 'password', 'username'],
    },
  },
});
