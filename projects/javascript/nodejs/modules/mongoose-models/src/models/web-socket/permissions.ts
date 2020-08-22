import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { WebSocket, WebSocketDocument } from './model';

export const WebSocketPermissions = new MongoosePermissions<WebSocketDocument>(WebSocket, {
  find: {
    base: {},
  },
  read: {
    base: ['_id', 'createdAt', 'gameId', 'updatedAt', 'userId'],
  },
});
