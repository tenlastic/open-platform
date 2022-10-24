import { ICredentials } from '@tenlastic/mongoose-permissions';
import * as webSocketServer from '@tenlastic/web-socket-server';

import {
  Authorization,
  AuthorizationDocument,
  Build,
  BuildPermissions,
  Collection,
  CollectionPermissions,
  GameServer,
  GameServerPermissions,
  Queue,
  QueueMember,
  QueueMemberPermissions,
  QueuePermissions,
  RecordPermissions,
  RecordSchema,
  RecordModel,
  Storefront,
  StorefrontPermissions,
  WebSocket,
  WebSocketPermissions,
  Workflow,
  WorkflowPermissions,
} from '../mongodb';

export async function subscribe(
  auth: webSocketServer.AuthenticationData,
  data: webSocketServer.SubscribeData,
  ws: webSocketServer.WebSocket,
) {
  let authorization: AuthorizationDocument;
  if (auth.apiKey) {
    authorization = await Authorization.findOne({ apiKey: auth.apiKey });
  } else if (auth.jwt?.authorization) {
    authorization = Authorization.hydrate(auth.jwt.authorization);
  } else if (auth.jwt?.user) {
    authorization = await Authorization.findOne({
      namespaceId: { $exists: false },
      userId: auth.jwt?.user?._id,
    });
  }
  const credentials: ICredentials = { apiKey: auth.apiKey, authorization, user: auth.jwt?.user };

  if (!data.parameters) {
    return webSocketServer.unsubscribe(data, ws);
  }

  switch (data.parameters.collection) {
    case 'builds':
      return webSocketServer.subscribe(credentials, data, Build, BuildPermissions, ws);

    case 'collections':
      return webSocketServer.subscribe(credentials, data, Collection, CollectionPermissions, ws);

    case 'game-servers':
      return webSocketServer.subscribe(credentials, data, GameServer, GameServerPermissions, ws);

    case 'queue-members':
      return webSocketServer.subscribe(credentials, data, QueueMember, QueueMemberPermissions, ws);

    case 'queues':
      return webSocketServer.subscribe(credentials, data, Queue, QueuePermissions, ws);

    case 'records':
      const { where } = data.parameters;
      const collectionId = where.collectionId.$eq || where.collectionId;
      const collection = await Collection.findOne({ _id: collectionId });
      const Model = RecordSchema.getModel(collection);
      const Permissions = RecordPermissions(collection, Model as RecordModel);
      return webSocketServer.subscribe(credentials, data, Model, Permissions, ws);

    case 'storefronts':
      return webSocketServer.subscribe(credentials, data, Storefront, StorefrontPermissions, ws);

    case 'web-sockets':
      return webSocketServer.subscribe(credentials, data, WebSocket, WebSocketPermissions, ws);

    case 'workflows':
      return webSocketServer.subscribe(credentials, data, Workflow, WorkflowPermissions, ws);
  }

  throw new Error('Invalid arguments.');
}
