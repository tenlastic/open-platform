import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, WebSocketDocument, WebSocketModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const WebSocketPermissions = new MongoosePermissions<WebSocketDocument>(WebSocketModel, {
  find: {
    default: {},
    'user-read': {},
  },
  read: {
    default: ['_id', 'createdAt', 'updatedAt', 'userId'],
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
