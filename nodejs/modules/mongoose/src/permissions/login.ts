import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, LoginDocument, LoginModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const LoginPermissions = new MongoosePermissions<LoginDocument>(LoginModel, {
  find: {
    default: { userId: { $ref: 'user._id' } },
    'user-read': {},
  },
  read: {
    default: ['_id', 'createdAt', 'updatedAt', 'userId'],
  },
  roles: {
    default: {},
    owner: { 'record.userId': { $ref: 'user._id' } },
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.LoginsRead]),
  },
});
