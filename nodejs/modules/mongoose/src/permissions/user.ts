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
    default: ['_id', 'createdAt', 'username', 'updatedAt'],
    owner: ['_id', 'createdAt', 'email', 'username', 'updatedAt'],
    'user-read': ['_id', 'createdAt', 'email', 'username', 'updatedAt'],
  },
  roles: {
    default: {},
    owner: { 'record._id': { $ref: 'user._id' } },
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.UsersRead,
      AuthorizationRole.UsersReadWrite,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.UsersReadWrite,
    ]),
  },
  update: {
    owner: ['email', 'password', 'username'],
    'user-write': ['email', 'password', 'username'],
  },
});
