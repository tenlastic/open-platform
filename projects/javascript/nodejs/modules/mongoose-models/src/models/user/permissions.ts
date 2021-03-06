import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { User, UserDocument, UserRole } from './model';

export const UserPermissions = new MongoosePermissions<UserDocument>(User, {
  create: {
    administrator: ['email', 'password', 'roles', 'username'],
    default: ['email', 'password', 'username'],
  },
  delete: {
    administrator: true,
    default: false,
    self: true,
  },
  find: {
    default: {},
  },
  read: {
    administrator: ['_id', 'createdAt', 'email', 'roles', 'username', 'updatedAt'],
    default: ['_id', 'createdAt', 'username', 'updatedAt'],
    self: ['_id', 'createdAt', 'email', 'roles', 'username', 'updatedAt'],
  },
  roles: [
    { name: 'administrator', query: { 'user.roles': UserRole.Users } },
    { name: 'self', query: { 'record._id': { $ref: 'user._id' } } },
  ],
  update: {
    administrator: ['email', 'roles', 'password', 'username'],
    default: [],
    self: ['email', 'password', 'username'],
  },
});

export const UserPermissionsHelpers = {
  getRoleQuery(role: UserRole) {
    return { 'user.roles': role };
  },
};
