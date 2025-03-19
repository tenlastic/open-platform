import {
  ArticleModel,
  AuthorizationModel,
  AuthorizationRequestModel,
  BuildModel,
  CollectionModel,
  GameServerModel,
  GameServerTemplateModel,
  GroupInvitationModel,
  GroupModel,
  LoginModel,
  MatchModel,
  MatchInvitationModel,
  NamespaceModel,
  QueueMemberModel,
  QueueModel,
  PasswordResetModel,
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
  GameServerEvent,
  GameServerTemplateEvent,
  GlobalNamespaceEvent,
  GroupEvent,
  GroupInvitationEvent,
  LoginEvent,
  MatchEvent,
  MatchInvitationEvent,
  NamespaceEvent,
  QueueEvent,
  QueueMemberEvent,
  PasswordResetEvent,
  RefreshTokenEvent,
  StorefrontEvent,
  UserEvent,
  WebSocketEvent,
  WorkflowEvent,
} from './events';

export interface SubscribeOptions {
  database: string;
  podName?: string;
}

export async function subscribe(options: SubscribeOptions) {
  const promises = [
    emit(options.database, options.database, ArticleEvent, ArticleModel),
    emit(options.database, options.database, AuthorizationEvent, AuthorizationModel),
    emit(options.database, options.database, AuthorizationRequestEvent, AuthorizationRequestModel),
    emit(options.database, options.database, BuildEvent, BuildModel),
    emit(options.database, options.database, CollectionEvent, CollectionModel),
    emit(options.database, options.database, GameServerEvent, GameServerModel),
    emit(options.database, options.database, GameServerTemplateEvent, GameServerTemplateModel),
    emit(options.database, options.database, GroupEvent, GroupModel),
    emit(options.database, options.database, GroupInvitationEvent, GroupInvitationModel),
    emit(options.database, options.database, LoginEvent, LoginModel),
    emit(options.database, options.database, MatchEvent, MatchModel),
    emit(options.database, options.database, MatchInvitationEvent, MatchInvitationModel),
    emit(options.database, options.database, NamespaceEvent, NamespaceModel),
    emit(options.database, options.database, QueueMemberEvent, QueueMemberModel),
    emit(options.database, options.database, QueueEvent, QueueModel),
    emit(options.database, options.database, PasswordResetEvent, PasswordResetModel),
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
