import {
  AuthorizationDocument,
  AuthorizationModel,
  AuthorizationPermissions,
  AuthorizationRequestModel,
  AuthorizationRequestPermissions,
  FriendModel,
  FriendPermissions,
  GroupModel,
  GroupPermissions,
  GroupInvitationModel,
  GroupInvitationPermissions,
  IgnorationModel,
  IgnorationPermissions,
  MatchInvitationModel,
  MatchInvitationPermissions,
  MatchModel,
  MatchPermissions,
  MessageModel,
  MessagePermissions,
  NamespaceModel,
  NamespacePermissions,
  StorefrontModel,
  StorefrontPermissions,
  QueueMemberModel,
  QueueMemberPermissions,
  UserModel,
  UserPermissions,
  WebSocketModel,
  WebSocketPermissions,
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
    case 'authorizations':
      return webSocketServer.subscribe(
        credentials,
        data,
        AuthorizationModel,
        AuthorizationPermissions,
        ws,
      );

    case 'authorization-requests':
      return webSocketServer.subscribe(
        credentials,
        data,
        AuthorizationRequestModel,
        AuthorizationRequestPermissions,
        ws,
      );

    case 'friends':
      return webSocketServer.subscribe(credentials, data, FriendModel, FriendPermissions, ws);

    case 'groups':
      return webSocketServer.subscribe(credentials, data, GroupModel, GroupPermissions, ws);

    case 'group-invitations':
      return webSocketServer.subscribe(
        credentials,
        data,
        GroupInvitationModel,
        GroupInvitationPermissions,
        ws,
      );

    case 'ignorations':
      return webSocketServer.subscribe(
        credentials,
        data,
        IgnorationModel,
        IgnorationPermissions,
        ws,
      );

    case 'match-invitations':
      return webSocketServer.subscribe(
        credentials,
        data,
        MatchInvitationModel,
        MatchInvitationPermissions,
        ws,
      );

    case 'matches':
      return webSocketServer.subscribe(credentials, data, MatchModel, MatchPermissions, ws);

    case 'messages':
      return webSocketServer.subscribe(credentials, data, MessageModel, MessagePermissions, ws);

    case 'namespaces':
      return webSocketServer.subscribe(credentials, data, NamespaceModel, NamespacePermissions, ws);

    case 'storefronts':
      return webSocketServer.subscribe(
        credentials,
        data,
        StorefrontModel,
        StorefrontPermissions,
        ws,
      );

    case 'queue-members':
      return webSocketServer.subscribe(
        credentials,
        data,
        QueueMemberModel,
        QueueMemberPermissions,
        ws,
      );

    case 'users':
      return webSocketServer.subscribe(credentials, data, UserModel, UserPermissions, ws);

    case 'web-sockets':
      return webSocketServer.subscribe(credentials, data, WebSocketModel, WebSocketPermissions, ws);
  }

  throw new Error('Invalid arguments.');
}
