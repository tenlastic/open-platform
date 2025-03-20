import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { AuthorizationRole, WebSocketDocument, WebSocketModel } from '../models';
import { AuthorizationPermissionsHelpers } from './authorization';

export const WebSocketPermissions = new MongoosePermissions<WebSocketDocument>(WebSocketModel, {
  find: {
    default: {},
    'user-read': {},
  },
  populate: [AuthorizationPermissionsHelpers.getPopulateQuery()],
  read: {
    default: ['_id', 'createdAt', 'disconnectedAt', 'namespaceId', 'updatedAt', 'userId'],
  },
  roles: {
    default: {},
    'namespace-read': AuthorizationPermissionsHelpers.getNamespaceRoleQuery([
      AuthorizationRole.WebSocketsRead,
    ]),
    'user-read': AuthorizationPermissionsHelpers.getUserRoleQuery([
      AuthorizationRole.WebSocketsRead,
    ]),
  },
});
