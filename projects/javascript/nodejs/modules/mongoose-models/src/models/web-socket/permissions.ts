import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { WebSocket, WebSocketDocument } from './model';

export const WebSocketPermissions = new MongoosePermissions<WebSocketDocument>(WebSocket, {
  find: {
    default: {},
  },
  read: {
    default: ['_id', 'createdAt', 'updatedAt', 'userId'],
  },
});
