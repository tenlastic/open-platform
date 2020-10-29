import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import {
  Collection,
  CollectionPermissions,
  GameInvitation,
  GameInvitationPermissions,
  GameServer,
  GameServerPermissions,
  GroupInvitation,
  GroupInvitationPermissions,
  Group,
  GroupPermissions,
  Log,
  LogPermissions,
  Message,
  MessagePermissions,
  Queue,
  QueueMember,
  QueueMemberPermissions,
  QueuePermissions,
  RecordDocument,
  RecordSchema,
  Release,
  ReleasePermissions,
  ReleaseTask,
  ReleaseTaskPermissions,
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

export async function subscribe(data: SubscribeData, jwt: any, ws: webServer.WebSocket) {
  let Model: mongoose.Model<mongoose.Document>;
  let Permissions: MongoosePermissions<any>;

  switch (data.parameters.collection) {
    case 'collections':
      Model = Collection;
      Permissions = CollectionPermissions;
      break;
    case 'game-invitations':
      Model = GameInvitation;
      Permissions = GameInvitationPermissions;
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
    case 'logs':
      Model = Log;
      Permissions = LogPermissions;
      break;
    case 'messages':
      Model = Message;
      Permissions = MessagePermissions;
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
      const collection = await Collection.findOne({ _id: data.parameters.collectionId });
      Model = RecordSchema.getModelForClass(collection);
      Permissions = new MongoosePermissions<RecordDocument>(Model as any, collection.permissions);
      break;
    case 'release-tasks':
      Model = ReleaseTask;
      Permissions = ReleaseTaskPermissions;
      break;
    case 'releases':
      Model = Release;
      Permissions = ReleasePermissions;
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

  consumers[data._id] = await kafka.watch(Model, Permissions, data.parameters, jwt.user, payload =>
    ws.send(JSON.stringify({ _id: data._id, ...payload })),
  );

  ws.on('close', () => consumers[data._id].disconnect());
}
