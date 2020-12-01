import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import {
  Build,
  BuildPermissions,
  BuildTask,
  BuildTaskPermissions,
  Collection,
  CollectionPermissions,
  File,
  FilePermissions,
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
} from '@tenlastic/mongoose-models';
import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import * as webServer from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

export interface SubscribeData {
  _id: string;
  method: string;
  parameters: SubscribeDataParameters;
}
export interface SubscribeDataParameters {
  collection: string;
  collectionId: string;
  resumeToken: string;
  where: any;
}

export const consumers = {};

export async function subscribe(
  auth: webServer.AuthenticationData,
  data: SubscribeData,
  ws: webServer.WebSocket,
) {
  let Model: mongoose.Model<mongoose.Document>;
  let Permissions: MongoosePermissions<any>;

  switch (data.parameters.collection) {
    case 'build-tasks':
      Model = BuildTask;
      Permissions = BuildTaskPermissions;
      break;
    case 'builds':
      Model = Build;
      Permissions = BuildPermissions;
      break;
    case 'collections':
      Model = Collection;
      Permissions = CollectionPermissions;
      break;
    case 'files':
      Model = File;
      Permissions = FilePermissions;
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
  }

  consumers[data._id] = await kafka.watch(
    Model,
    Permissions,
    data.parameters,
    auth.key || auth.jwt.user,
    payload => ws.send(JSON.stringify({ _id: data._id, ...payload })),
    err => {
      console.error(err);

      const { message, name } = err;
      const errors = { errors: [{ message, name }] };
      ws.send(JSON.stringify(errors));
    },
  );

  ws.on('close', () => consumers[data._id].disconnect());
}
