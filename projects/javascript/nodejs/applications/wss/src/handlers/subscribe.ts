import {
  Build,
  BuildPermissions,
  Database,
  DatabasePermissions,
  Game,
  GameAuthorization,
  GameAuthorizationPermissions,
  GamePermissions,
  GameServer,
  GameServerPermissions,
  GroupInvitation,
  GroupInvitationPermissions,
  Group,
  GroupPermissions,
  Message,
  MessagePermissions,
  Queue,
  QueueMember,
  QueueMemberPermissions,
  QueuePermissions,
  User,
  UserPermissions,
  WebSocket,
  WebSocketPermissions,
  Workflow,
  WorkflowPermissions,
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
    case 'builds':
      return webSocketServer.subscribe(auth, data, Build, BuildPermissions, ws);

    case 'databases':
      return webSocketServer.subscribe(auth, data, Database, DatabasePermissions, ws);

    case 'games':
      return webSocketServer.subscribe(auth, data, Game, GamePermissions, ws);

    case 'game-authorizations':
      return webSocketServer.subscribe(
        auth,
        data,
        GameAuthorization,
        GameAuthorizationPermissions,
        ws,
      );

    case 'game-servers':
      return webSocketServer.subscribe(auth, data, GameServer, GameServerPermissions, ws);

    case 'group-invitations':
      return webSocketServer.subscribe(auth, data, GroupInvitation, GroupInvitationPermissions, ws);

    case 'groups':
      return webSocketServer.subscribe(auth, data, Group, GroupPermissions, ws);

    case 'messages':
      return webSocketServer.subscribe(auth, data, Message, MessagePermissions, ws);

    case 'queue-members':
      return webSocketServer.subscribe(auth, data, QueueMember, QueueMemberPermissions, ws);

    case 'queues':
      return webSocketServer.subscribe(auth, data, Queue, QueuePermissions, ws);

    case 'users':
      return webSocketServer.subscribe(auth, data, User, UserPermissions, ws);

    case 'web-sockets':
      return webSocketServer.subscribe(auth, data, WebSocket, WebSocketPermissions, ws);

    case 'workflows':
      return webSocketServer.subscribe(auth, data, Workflow, WorkflowPermissions, ws);
  }

  throw new Error('Invalid arguments.');
}
