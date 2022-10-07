import { publish, subscribe } from '@tenlastic/mongoose-change-stream-nats';
import * as nats from '@tenlastic/nats';

import {
  Authorization,
  Friend,
  GroupInvitation,
  Group,
  Ignoration,
  Login,
  Message,
  Namespace,
  OnAuthorizationProduced,
  OnFriendProduced,
  OnGroupInvitationProduced,
  OnGroupProduced,
  OnIgnorationProduced,
  OnLoginProduced,
  OnMessageProduced,
  OnNamespaceProduced,
  OnPasswordResetProduced,
  OnUserProduced,
  OnWebSocketProduced,
  PasswordReset,
  User,
  WebSocket,
} from '../mongodb';
import { AuthorizationEvent } from './authorization';
import { FriendEvent } from './friend';
import { GroupEvent } from './group';
import { GroupInvitationEvent } from './group-invitation';
import { IgnorationEvent } from './ignoration';
import { LoginEvent } from './login';
import { MessageEvent } from './message';
import { NamespaceEvent } from './namespace';
import { PasswordResetEvent } from './password-reset';
import { UserEvent } from './user';
import { WebSocketEvent } from './web-socket';

export interface SetupOptions extends nats.ConnectionOptions {
  durable: string;
}

export async function setup(options: SetupOptions) {
  await nats.connect({ connectionString: options.connectionString });

  OnAuthorizationProduced.sync(publish);
  OnFriendProduced.sync(publish);
  OnGroupInvitationProduced.sync(publish);
  OnGroupProduced.sync(publish);
  OnIgnorationProduced.sync(publish);
  OnLoginProduced.sync(publish);
  OnMessageProduced.sync(publish);
  OnNamespaceProduced.sync(publish);
  OnPasswordResetProduced.sync(publish);
  OnUserProduced.sync(publish);
  OnWebSocketProduced.sync(publish);

  return Promise.all([
    subscribe(options.durable, Authorization, (payload) => AuthorizationEvent.emit(payload)),
    subscribe(options.durable, Friend, (payload) => FriendEvent.emit(payload)),
    subscribe(options.durable, GroupInvitation, (payload) => GroupInvitationEvent.emit(payload)),
    subscribe(options.durable, Group, (payload) => GroupEvent.emit(payload)),
    subscribe(options.durable, Ignoration, (payload) => IgnorationEvent.emit(payload)),
    subscribe(options.durable, Login, (payload) => LoginEvent.emit(payload)),
    subscribe(options.durable, Message, (payload) => MessageEvent.emit(payload)),
    subscribe(options.durable, Namespace, (payload) => NamespaceEvent.emit(payload)),
    subscribe(options.durable, PasswordReset, (payload) => PasswordResetEvent.emit(payload)),
    subscribe(options.durable, User, (payload) => UserEvent.emit(payload)),
    subscribe(options.durable, WebSocket, (payload) => WebSocketEvent.emit(payload)),
  ]);
}
