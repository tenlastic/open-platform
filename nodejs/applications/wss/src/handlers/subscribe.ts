import {
  Authorization,
  AuthorizationPermissions,
  Build,
  BuildPermissions,
  Collection,
  CollectionPermissions,
  GameServer,
  GameServerPermissions,
  GroupInvitation,
  GroupInvitationPermissions,
  Group,
  GroupPermissions,
  Message,
  MessagePermissions,
  Namespace,
  NamespacePermissions,
  Queue,
  QueueMember,
  QueueMemberPermissions,
  QueuePermissions,
  RecordSchema,
  RecordModel,
  Storefront,
  StorefrontPermissions,
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
    case 'authorizations':
      return webSocketServer.subscribe(auth, data, Authorization, AuthorizationPermissions, ws);

    case 'builds':
      return webSocketServer.subscribe(auth, data, Build, BuildPermissions, ws);

    case 'collections':
      return webSocketServer.subscribe(auth, data, Collection, CollectionPermissions, ws);

    case 'game-servers':
      return webSocketServer.subscribe(auth, data, GameServer, GameServerPermissions, ws);

    case 'group-invitations':
      return webSocketServer.subscribe(auth, data, GroupInvitation, GroupInvitationPermissions, ws);

    case 'groups':
      return webSocketServer.subscribe(auth, data, Group, GroupPermissions, ws);

    case 'messages':
      return webSocketServer.subscribe(auth, data, Message, MessagePermissions, ws);

    case 'namespaces':
      return webSocketServer.subscribe(auth, data, Namespace, NamespacePermissions, ws);

    case 'queue-members':
      return webSocketServer.subscribe(auth, data, QueueMember, QueueMemberPermissions, ws);

    case 'queues':
      return webSocketServer.subscribe(auth, data, Queue, QueuePermissions, ws);

    case 'records':
      const { where } = data.parameters;
      const collectionId = where.collectionId.$eq || where.collectionId;
      const collection = await Collection.findOne({ _id: collectionId });
      const Model = RecordSchema.getModel(collection);
      const Permissions = RecordSchema.getPermissions(Model as RecordModel, collection);
      return webSocketServer.subscribe(auth, data, Model, Permissions, ws);

    case 'storefronts':
      return webSocketServer.subscribe(auth, data, Storefront, StorefrontPermissions, ws);

    case 'users':
      return webSocketServer.subscribe(auth, data, User, UserPermissions, ws);

    case 'web-sockets':
      return webSocketServer.subscribe(auth, data, WebSocket, WebSocketPermissions, ws);

    case 'workflows':
      return webSocketServer.subscribe(auth, data, Workflow, WorkflowPermissions, ws);
  }

  throw new Error('Invalid arguments.');
}
