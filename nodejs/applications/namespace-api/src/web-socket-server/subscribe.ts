import {
  ArticleModel,
  ArticlePermissions,
  AuthorizationDocument,
  AuthorizationModel,
  BuildModel,
  BuildPermissions,
  CollectionModel,
  CollectionPermissions,
  GameServerModel,
  GameServerPermissions,
  GameServerTemplateModel,
  GameServerTemplatePermissions,
  MatchModel,
  MatchPermissions,
  QueueModel,
  QueueMemberModel,
  QueueMemberPermissions,
  QueuePermissions,
  RecordPermissions,
  RecordSchema,
  StorefrontModel,
  StorefrontPermissions,
  WebSocketModel,
  WebSocketPermissions,
  WorkflowModel,
  WorkflowPermissions,
} from '@tenlastic/mongoose';
import { ICredentials } from '@tenlastic/mongoose-permissions';
import * as webSocketServer from '@tenlastic/web-socket-server';

export async function subscribe(
  auth: webSocketServer.AuthenticationData,
  data: webSocketServer.SubscribeData,
  ws: webSocketServer.WebSocket,
) {
  let authorization: AuthorizationDocument;
  if (auth.apiKey) {
    authorization = await AuthorizationModel.findOne({ apiKey: auth.apiKey });
  } else if (auth.jwt?.authorization) {
    authorization = AuthorizationModel.hydrate(auth.jwt.authorization);
  } else if (auth.jwt?.user) {
    authorization = await AuthorizationModel.findOne({
      namespaceId: { $exists: false },
      userId: auth.jwt?.user?._id,
    });
  }
  const credentials: ICredentials = { apiKey: auth.apiKey, authorization, user: auth.jwt?.user };

  if (!data.parameters) {
    return webSocketServer.unsubscribe(data, ws);
  }

  switch (data.parameters.collection) {
    case 'articles':
      return webSocketServer.subscribe(credentials, data, ArticleModel, ArticlePermissions, ws);

    case 'builds':
      return webSocketServer.subscribe(credentials, data, BuildModel, BuildPermissions, ws);

    case 'collections':
      return webSocketServer.subscribe(
        credentials,
        data,
        CollectionModel,
        CollectionPermissions,
        ws,
      );

    case 'game-server-templates':
      return webSocketServer.subscribe(
        credentials,
        data,
        GameServerTemplateModel,
        GameServerTemplatePermissions,
        ws,
      );

    case 'game-servers':
      return webSocketServer.subscribe(
        credentials,
        data,
        GameServerModel,
        GameServerPermissions,
        ws,
      );

    case 'matches':
      return webSocketServer.subscribe(credentials, data, MatchModel, MatchPermissions, ws);

    case 'queue-members':
      return webSocketServer.subscribe(
        credentials,
        data,
        QueueMemberModel,
        QueueMemberPermissions,
        ws,
      );

    case 'queues':
      return webSocketServer.subscribe(credentials, data, QueueModel, QueuePermissions, ws);

    case 'records':
      const { where } = data.parameters;
      const collectionId = where.collectionId.$eq || where.collectionId;
      const collection = await CollectionModel.findOne({ _id: collectionId });
      const Model = RecordSchema.getModel(collection);
      const Permissions = RecordPermissions(collection, Model);
      return webSocketServer.subscribe(credentials, data, Model, Permissions, ws);

    case 'storefronts':
      return webSocketServer.subscribe(
        credentials,
        data,
        StorefrontModel,
        StorefrontPermissions,
        ws,
      );

    case 'web-sockets':
      return webSocketServer.subscribe(credentials, data, WebSocketModel, WebSocketPermissions, ws);

    case 'workflows':
      return webSocketServer.subscribe(credentials, data, WorkflowModel, WorkflowPermissions, ws);
  }

  throw new Error('Invalid arguments.');
}
