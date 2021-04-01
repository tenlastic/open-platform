import {
  Build,
  BuildLog,
  BuildLogPermissions,
  BuildPermissions,
  Collection,
  CollectionPermissions,
  Database,
  DatabasePermissions,
  GameInvitation,
  GameInvitationPermissions,
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
  RecordModel,
  RecordSchema,
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
    case 'collections':
      Model = Collection;
      Permissions = CollectionPermissions;
      break;
    case 'databases':
      Model = Database;
      Permissions = DatabasePermissions;
      break;
    case 'game-invitations':
      Model = GameInvitation;
      Permissions = GameInvitationPermissions;
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
    case 'records':
      const collection = await Collection.findOne({ _id: data.parameters.where.collectionId.$eq });
      Model = RecordSchema.getModel(collection);
      Permissions = RecordSchema.getPermissions(Model as RecordModel, collection);
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

  return webSocketServer.subscribe(auth, data, Model, Permissions, ws);
}
