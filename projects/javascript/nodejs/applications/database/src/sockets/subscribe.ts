import {
  Collection,
  CollectionPermissions,
  RecordModel,
  RecordSchema,
  WebSocket,
  WebSocketPermissions,
} from '@tenlastic/mongoose-models';
import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as webSocketServer from '@tenlastic/web-socket-server';
import * as mongoose from 'mongoose';

export async function subscribe(
  auth: webSocketServer.AuthenticationData,
  data: webSocketServer.SubscribeData,
  ws: webSocketServer.WebSocket,
) {
  let Model: mongoose.Model<mongoose.Document>;
  let Permissions: MongoosePermissions<any>;

  switch (data.parameters.collection) {
    case 'collections':
      Model = Collection;
      Permissions = CollectionPermissions;
      break;

    case 'records':
      const { where } = data.parameters;
      const collectionId = where.collectionId.$eq || where.collectionId;
      const collection = await Collection.findOne({ _id: collectionId });
      Model = RecordSchema.getModel(collection);
      Permissions = RecordSchema.getPermissions(Model as RecordModel, collection);
      break;

    case 'web-sockets':
      Model = WebSocket;
      Permissions = WebSocketPermissions;
      break;
  }

  return webSocketServer.subscribe(auth, data, Model, Permissions, ws);
}
