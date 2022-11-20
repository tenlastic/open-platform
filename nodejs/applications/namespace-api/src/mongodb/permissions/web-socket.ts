import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, WebSocket, WebSocketDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const WebSocketPermissions = new MongoosePermissions<WebSocketDocument>(WebSocket, {
  find: {
    default: {
      $or: [{ disconnectedAt: { $exists: false } }, { userId: { $ref: 'user._id' } }],
    },
    'user-read': {},
  },
  read: {
    default: ['_id', 'createdAt', 'disconnectedAt', 'namespaceId', 'updatedAt', 'userId'],
  },
  roles: {
    default: {},
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.WebSocketsRead,
      AuthorizationRole.WebSocketsReadWrite,
    ]),
    'user-write': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.WebSocketsReadWrite,
    ]),
  },
});
