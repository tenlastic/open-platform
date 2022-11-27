import { AuthorizationRole } from '@tenlastic/mongoose';
import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { WebSocket, WebSocketDocument } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const WebSocketPermissions = new MongoosePermissions<WebSocketDocument>(WebSocket, {
  find: {
    default: {},
    'user-read': {},
  },
  read: {
    default: ['_id', 'createdAt', 'namespaceId', 'updatedAt', 'userId'],
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
