import {
  ArticleModel,
  AuthorizationModel,
  AuthorizationRequestModel,
  BuildModel,
  CollectionModel,
  FriendModel,
  GameServerModel,
  GroupInvitationModel,
  GroupModel,
  IgnorationModel,
  LoginModel,
  MatchModel,
  MatchInvitationModel,
  MessageModel,
  NamespaceModel,
  QueueMemberModel,
  QueueModel,
  RefreshTokenModel,
  StorefrontModel,
  UserModel,
  WebSocketModel,
  WorkflowModel,
} from '@tenlastic/mongoose';

import { emit } from './emit';
import {
  ArticleEvent,
  AuthorizationEvent,
  AuthorizationRequestEvent,
  BuildEvent,
  CollectionEvent,
  FriendEvent,
  GameServerEvent,
  GlobalNamespaceEvent,
  GroupEvent,
  GroupInvitationEvent,
  IgnorationEvent,
  LoginEvent,
  MatchEvent,
  MatchInvitationEvent,
  MessageEvent,
  NamespaceEvent,
  QueueEvent,
  QueueMemberEvent,
  RefreshTokenEvent,
  StorefrontEvent,
  UserEvent,
  WebSocketEvent,
  WorkflowEvent,
} from './events';

export interface SubscribeOptions {
  database: string;
  durable: string;
  podName?: string;
}

export function subscribe(options: SubscribeOptions) {
  const promises = [
    emit(options.database, options.durable, ArticleEvent, ArticleModel),
    emit(options.database, options.durable, AuthorizationEvent, AuthorizationModel),
    emit(options.database, options.durable, AuthorizationRequestEvent, AuthorizationRequestModel),
    emit(options.database, options.durable, BuildEvent, BuildModel),
    emit(options.database, options.durable, CollectionEvent, CollectionModel),
    emit(options.database, options.durable, FriendEvent, FriendModel),
    emit(options.database, options.durable, GameServerEvent, GameServerModel),
    emit(options.database, options.durable, GroupEvent, GroupModel),
    emit(options.database, options.durable, GroupInvitationEvent, GroupInvitationModel),
    emit(options.database, options.durable, IgnorationEvent, IgnorationModel),
    emit(options.database, options.durable, LoginEvent, LoginModel),
    emit(options.database, options.durable, MatchEvent, MatchModel),
    emit(options.database, options.durable, MatchInvitationEvent, MatchInvitationModel),
    emit(options.database, options.durable, MessageEvent, MessageModel),
    emit(options.database, options.durable, NamespaceEvent, NamespaceModel),
    emit(options.database, options.durable, QueueMemberEvent, QueueMemberModel),
    emit(options.database, options.durable, QueueEvent, QueueModel),
    emit(options.database, options.durable, RefreshTokenEvent, RefreshTokenModel),
    emit(options.database, options.durable, StorefrontEvent, StorefrontModel),
    emit(options.database, options.durable, UserEvent, UserModel),
    emit(options.database, options.durable, WebSocketEvent, WebSocketModel),
    emit(options.database, options.durable, WorkflowEvent, WorkflowModel),
  ];

  if (options.podName) {
    promises.push(emit(options.database, options.podName, GlobalNamespaceEvent, NamespaceModel));
  }

  return Promise.all(promises);
}
