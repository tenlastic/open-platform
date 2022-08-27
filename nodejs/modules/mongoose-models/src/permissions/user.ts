import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, User, UserDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const UserPermissions = new MongoosePermissions<UserDocument>(User, {
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
    'user-write': ['_id', 'createdAt', 'email', 'username', 'updatedAt'],
  },
  roles: [
    {
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.UsersReadWrite]),
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.UsersRead,
        AuthorizationRole.UsersReadWrite,
      ]),
    },
    { name: 'owner', query: { 'record._id': { $ref: 'user._id' } } },
  ],
  update: {
    owner: ['email', 'password', 'username'],
    'user-write': ['email', 'password', 'username'],
  },
});
