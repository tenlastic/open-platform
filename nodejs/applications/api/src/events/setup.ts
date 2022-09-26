import { publish, subscribe } from '@tenlastic/mongoose-change-stream-nats';

import {
  Article,
  Authorization,
  Build,
  Collection,
  Friend,
  GameServer,
  GroupInvitation,
  Group,
  Ignoration,
  Login,
  Message,
  Namespace,
  OnArticleProduced,
  OnAuthorizationProduced,
  OnBuildProduced,
  OnCollectionProduced,
  OnFriendProduced,
  OnGameServerProduced,
  OnGroupInvitationProduced,
  OnGroupProduced,
  OnIgnorationProduced,
  OnLoginProduced,
  OnMessageProduced,
  OnNamespaceProduced,
  OnPasswordResetProduced,
  OnQueueMemberProduced,
  OnQueueProduced,
  OnRecordProduced,
  OnStorefrontProduced,
  OnUserProduced,
  OnWebSocketProduced,
  OnWorkflowProduced,
  PasswordReset,
  QueueMember,
  Queue,
  Storefront,
  User,
  WebSocket,
  Workflow,
} from '../mongodb';
import { ArticleEvent } from './article';
import { AuthorizationEvent } from './authorization';
import { BuildEvent } from './build';
import { CollectionEvent } from './collection';
import { FriendEvent } from './friend';
import { GameServerEvent } from './game-server';
import { GroupEvent } from './group';
import { GroupInvitationEvent } from './group-invitation';
import { IgnorationEvent } from './ignoration';
import { LoginEvent } from './login';
import { MessageEvent } from './message';
import { NamespaceEvent } from './namespace';
import { PasswordResetEvent } from './password-reset';
import { QueueEvent } from './queue';
import { QueueMemberEvent } from './queue-member';
import { StorefrontEvent } from './storefront';
import { UserEvent } from './user';
import { WebSocketEvent } from './web-socket';
import { WorkflowEvent } from './workflow';

export function setup(durable: string) {
  OnArticleProduced.sync(publish);
  OnAuthorizationProduced.sync(publish);
  OnBuildProduced.sync(publish);
  OnCollectionProduced.sync(publish);
  OnFriendProduced.sync(publish);
  OnGameServerProduced.sync(publish);
  OnGroupInvitationProduced.sync(publish);
  OnGroupProduced.sync(publish);
  OnIgnorationProduced.sync(publish);
  OnLoginProduced.sync(publish);
  OnMessageProduced.sync(publish);
  OnNamespaceProduced.sync(publish);
  OnPasswordResetProduced.sync(publish);
  OnQueueMemberProduced.sync(publish);
  OnQueueProduced.sync(publish);
  OnRecordProduced.sync(publish);
  OnStorefrontProduced.sync(publish);
  OnUserProduced.sync(publish);
  OnWebSocketProduced.sync(publish);
  OnWorkflowProduced.sync(publish);

  return Promise.all([
    subscribe(durable, Article, (payload) => ArticleEvent.emit(payload)),
    subscribe(durable, Authorization, (payload) => AuthorizationEvent.emit(payload)),
    subscribe(durable, Build, (payload) => BuildEvent.emit(payload)),
    subscribe(durable, Collection, (payload) => CollectionEvent.emit(payload)),
    subscribe(durable, Friend, (payload) => FriendEvent.emit(payload)),
    subscribe(durable, GameServer, (payload) => GameServerEvent.emit(payload)),
    subscribe(durable, GroupInvitation, (payload) => GroupInvitationEvent.emit(payload)),
    subscribe(durable, Group, (payload) => GroupEvent.emit(payload)),
    subscribe(durable, Ignoration, (payload) => IgnorationEvent.emit(payload)),
    subscribe(durable, Login, (payload) => LoginEvent.emit(payload)),
    subscribe(durable, Message, (payload) => MessageEvent.emit(payload)),
    subscribe(durable, Namespace, (payload) => NamespaceEvent.emit(payload)),
    subscribe(durable, PasswordReset, (payload) => PasswordResetEvent.emit(payload)),
    subscribe(durable, QueueMember, (payload) => QueueMemberEvent.emit(payload)),
    subscribe(durable, Queue, (payload) => QueueEvent.emit(payload)),
    subscribe(durable, Storefront, (payload) => StorefrontEvent.emit(payload)),
    subscribe(durable, User, (payload) => UserEvent.emit(payload)),
    subscribe(durable, WebSocket, (payload) => WebSocketEvent.emit(payload)),
    subscribe(durable, Workflow, (payload) => WorkflowEvent.emit(payload)),
  ]);
}
