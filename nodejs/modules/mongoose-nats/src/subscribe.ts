import {
  ArticleModel,
  AuthorizationModel,
  AuthorizationRequestModel,
  BuildModel,
  CollectionModel,
  FriendModel,
  GameServerModel,
  GameServerTemplateModel,
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
import * as nats from '@tenlastic/nats';

import { emit } from './emit';
import {
  ArticleEvent,
  AuthorizationEvent,
  AuthorizationRequestEvent,
  BuildEvent,
  CollectionEvent,
  FriendEvent,
  GameServerEvent,
  GameServerTemplateEvent,
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
  maxBytes: number;
  podName?: string;
}

export async function subscribe(options: SubscribeOptions) {
  await nats.upsertStream(options.database, { max_bytes: options.maxBytes });

  const promises = [
    emit(options.database, options.database, ArticleEvent, ArticleModel),
    emit(options.database, options.database, AuthorizationEvent, AuthorizationModel),
    emit(options.database, options.database, AuthorizationRequestEvent, AuthorizationRequestModel),
    emit(options.database, options.database, BuildEvent, BuildModel),
    emit(options.database, options.database, CollectionEvent, CollectionModel),
    emit(options.database, options.database, FriendEvent, FriendModel),
    emit(options.database, options.database, GameServerEvent, GameServerModel),
    emit(options.database, options.database, GameServerTemplateEvent, GameServerTemplateModel),
    emit(options.database, options.database, GroupEvent, GroupModel),
    emit(options.database, options.database, GroupInvitationEvent, GroupInvitationModel),
    emit(options.database, options.database, IgnorationEvent, IgnorationModel),
    emit(options.database, options.database, LoginEvent, LoginModel),
    emit(options.database, options.database, MatchEvent, MatchModel),
    emit(options.database, options.database, MatchInvitationEvent, MatchInvitationModel),
    emit(options.database, options.database, MessageEvent, MessageModel),
    emit(options.database, options.database, NamespaceEvent, NamespaceModel),
    emit(options.database, options.database, QueueMemberEvent, QueueMemberModel),
    emit(options.database, options.database, QueueEvent, QueueModel),
    emit(options.database, options.database, RefreshTokenEvent, RefreshTokenModel),
    emit(options.database, options.database, StorefrontEvent, StorefrontModel),
    emit(options.database, options.database, UserEvent, UserModel),
    emit(options.database, options.database, WebSocketEvent, WebSocketModel),
    emit(options.database, options.database, WorkflowEvent, WorkflowModel),
  ];

  if (options.podName) {
    const promise = emit(options.database, options.podName, GlobalNamespaceEvent, NamespaceModel);
    promises.push(promise);
  }

  return Promise.all(promises);
}
