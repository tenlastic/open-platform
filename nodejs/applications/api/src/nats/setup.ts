import { subscribe } from '@tenlastic/mongoose-change-stream-nats';
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

export interface SetupOptions extends nats.ConnectionOptions {}

export async function setup(options: SetupOptions) {
  await nats.connect({ connectionString: options.connectionString });

  return Promise.all([
    subscribe('api', 'api', Authorization, (payload) => AuthorizationEvent.emit(payload)),
    subscribe('api', 'api', Friend, (payload) => FriendEvent.emit(payload)),
    subscribe('api', 'api', GroupInvitation, (payload) => GroupInvitationEvent.emit(payload)),
    subscribe('api', 'api', Group, (payload) => GroupEvent.emit(payload)),
    subscribe('api', 'api', Ignoration, (payload) => IgnorationEvent.emit(payload)),
    subscribe('api', 'api', Login, (payload) => LoginEvent.emit(payload)),
    subscribe('api', 'api', Message, (payload) => MessageEvent.emit(payload)),
    subscribe('api', 'api', Namespace, (payload) => NamespaceEvent.emit(payload)),
    subscribe('api', 'api', PasswordReset, (payload) => PasswordResetEvent.emit(payload)),
    subscribe('api', 'api', User, (payload) => UserEvent.emit(payload)),
    subscribe('api', 'api', WebSocket, (payload) => WebSocketEvent.emit(payload)),
  ]);
}
