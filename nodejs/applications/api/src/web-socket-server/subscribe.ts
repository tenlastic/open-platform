import { ICredentials } from '@tenlastic/mongoose-permissions';
import * as webSocketServer from '@tenlastic/web-socket-server';

import {
  Authorization,
  AuthorizationDocument,
  AuthorizationPermissions,
  AuthorizationRequest,
  AuthorizationRequestPermissions,
  Namespace,
  NamespacePermissions,
  User,
  UserPermissions,
  WebSocket,
  WebSocketPermissions,
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
    case 'authorizations':
      return webSocketServer.subscribe(
        credentials,
        data,
        Authorization,
        AuthorizationPermissions,
        ws,
      );

    case 'authorization-requests':
      return webSocketServer.subscribe(
        credentials,
        data,
        AuthorizationRequest,
        AuthorizationRequestPermissions,
        ws,
      );

    case 'namespaces':
      return webSocketServer.subscribe(credentials, data, Namespace, NamespacePermissions, ws);

    case 'users':
      return webSocketServer.subscribe(credentials, data, User, UserPermissions, ws);

    case 'web-sockets':
      return webSocketServer.subscribe(credentials, data, WebSocket, WebSocketPermissions, ws);
  }

  throw new Error('Invalid arguments.');
}
