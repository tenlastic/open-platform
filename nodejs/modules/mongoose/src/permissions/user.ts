import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, UserDocument, UserModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const UserPermissions = new MongoosePermissions<UserDocument>(UserModel, {
  create: {
    default: ['email', 'password', 'username'],
    'user-write': ['email', 'password', 'username'],
  },
  delete: {
    owner: true,
    'user-write': true,
  },
  find: {
    default: {},
  },
  read: {
    default: ['_id', 'createdAt', 'updatedAt', 'username'],
    owner: ['_id', 'createdAt', 'email', 'steamId', 'updatedAt', 'username'],
    'user-read': ['_id', 'createdAt', 'email', 'steamId', 'updatedAt', 'username'],
  },
  roles: {
    default: {},
    owner: { 'record._id': { $ref: 'user._id' } },
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.UsersRead]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.UsersWrite]),
  },
  update: {
    owner: ['email', 'username'],
    'user-write': ['email', 'username'],
  },
});
