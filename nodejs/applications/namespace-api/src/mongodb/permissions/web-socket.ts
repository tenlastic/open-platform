import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, WebSocket, WebSocketDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const WebSocketPermissions = new MongoosePermissions<WebSocketDocument>(WebSocket, {
  find: {
    default: {
      $or: [{ disconnectedAt: { $exists: false } }, { userId: { $ref: 'user._id' } }],
    },
    'user-read': {},
    'user-write': {},
  },
  read: {
    default: ['_id', 'createdAt', 'disconnectedAt', 'updatedAt', 'userId'],
  },
  roles: [
    {
      name: 'user-write',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.WebSocketsReadWrite,
      ]),
    },
    {
      name: 'user-read',
      query: AuthorizationPermissionsHelpers.getUserRoleQuery([
        AuthorizationRole.WebSocketsRead,
        AuthorizationRole.WebSocketsReadWrite,
      ]),
    },
  ],
});
