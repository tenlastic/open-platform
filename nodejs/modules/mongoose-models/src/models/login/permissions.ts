import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationPermissionsHelpers, AuthorizationRole } from '../authorization';
import { Login, LoginDocument } from './model';

export const LoginPermissions = new MongoosePermissions<LoginDocument>(Login, {
  find: {
    default: { userId: { $ref: 'user._id' } },
    'user-read': {},
  },
  read: {
    default: ['_id', 'createdAt', 'updatedAt', 'userId'],
  },
  roles: [
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([AuthorizationRole.LoginsRead]),
    },
    {
      name: 'owner',
      query: { 'record.userId': { $ref: 'user._id' } },
    },
  ],
});
