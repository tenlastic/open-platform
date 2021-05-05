import {
  Build,
  BuildLog,
  BuildLogPermissions,
  BuildPermissions,
  Database,
  DatabasePermissions,
  Game,
  GameAuthorization,
  GameAuthorizationPermissions,
  GamePermissions,
  GameServer,
  GameServerLog,
  GameServerLogPermissions,
  GameServerPermissions,
  GroupInvitation,
  GroupInvitationPermissions,
  Group,
  GroupPermissions,
  Message,
  MessagePermissions,
  Queue,
  QueueLog,
  QueueLogPermissions,
  QueueMember,
  QueueMemberPermissions,
  QueuePermissions,
  User,
  UserPermissions,
  WebSocket,
  WebSocketPermissions,
  Workflow,
  WorkflowLog,
  WorkflowLogPermissions,
  WorkflowPermissions,
} from '@tenlastic/mongoose-models';
import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';
import * as webSocketServer from '@tenlastic/web-socket-server';

export async function subscribe(
  auth: webSocketServer.AuthenticationData,
  data: webSocketServer.SubscribeData,
  ws: webSocketServer.WebSocket,
) {
  let Model: mongoose.Model<mongoose.Document>;
  let Permissions: MongoosePermissions<any>;

  switch (data.parameters.collection) {
    case 'build-logs':
      Model = BuildLog;
      Permissions = BuildLogPermissions;
      break;

    case 'builds':
      Model = Build;
      Permissions = BuildPermissions;
      break;

    case 'databases':
      Model = Database;
      Permissions = DatabasePermissions;
      break;

    case 'games':
      Model = Game;
      Permissions = GamePermissions;
      break;

    case 'game-authorizations':
      Model = GameAuthorization;
      Permissions = GameAuthorizationPermissions;
      break;

    case 'game-server-logs':
      Model = GameServerLog;
      Permissions = GameServerLogPermissions;
      break;

    case 'game-servers':
      Model = GameServer;
      Permissions = GameServerPermissions;
      break;

    case 'group-invitations':
      Model = GroupInvitation;
      Permissions = GroupInvitationPermissions;
      break;

    case 'groups':
      Model = Group;
      Permissions = GroupPermissions;
      break;

    case 'messages':
      Model = Message;
      Permissions = MessagePermissions;
      break;

    case 'queue-logs':
      Model = QueueLog;
      Permissions = QueueLogPermissions;
      break;

    case 'queue-members':
      Model = QueueMember;
      Permissions = QueueMemberPermissions;
      break;

    case 'queues':
      Model = Queue;
      Permissions = QueuePermissions;
      break;

    case 'users':
      Model = User;
      Permissions = UserPermissions;
      break;

    case 'web-sockets':
      Model = WebSocket;
      Permissions = WebSocketPermissions;
      break;

    case 'workflows':
      Model = Workflow;
      Permissions = WorkflowPermissions;
      break;

    case 'workflow-logs':
      Model = WorkflowLog;
      Permissions = WorkflowLogPermissions;
      break;
  }

  if (!Model || !Permissions) {
    return;
  }

  return webSocketServer.subscribe(auth, data, Model, Permissions, ws);
}
