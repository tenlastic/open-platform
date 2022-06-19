import {
  Collection,
  CollectionPermissions,
  RecordModel,
  RecordSchema,
  WebSocket,
  WebSocketPermissions,
} from '@tenlastic/mongoose-models';
import * as webSocketServer from '@tenlastic/web-socket-server';

export async function subscribe(
  auth: webSocketServer.AuthenticationData,
  data: webSocketServer.SubscribeData,
  ws: webSocketServer.WebSocket,
) {
  if (!data.parameters) {
    return webSocketServer.unsubscribe(auth, data, ws);
  }

  switch (data.parameters.collection) {
    case 'collections':
      return webSocketServer.subscribe(auth, data, Collection, CollectionPermissions, ws);

    case 'records':
      const { where } = data.parameters;
      const collectionId = where.collectionId.$eq || where.collectionId;
      const collection = await Collection.findOne({ _id: collectionId });
      const Model = RecordSchema.getModel(collection);
      const Permissions = RecordSchema.getPermissions(Model as RecordModel, collection);
      return webSocketServer.subscribe(auth, data, Model, Permissions, ws);

    case 'web-sockets':
      return webSocketServer.subscribe(auth, data, WebSocket, WebSocketPermissions, ws);
  }

  throw new Error('Invalid arguments.');
}
