import { subscribe } from '@tenlastic/mongoose-change-stream-nats';
import * as nats from '@tenlastic/nats';

import {
  Authorization,
  AuthorizationRequest,
  Login,
  Namespace,
  PasswordReset,
  User,
  WebSocket,
} from '../mongodb';
import { AuthorizationEvent } from './authorization';
import { AuthorizationRequestEvent } from './authorization-request';
import { LoginEvent } from './login';
import { NamespaceEvent } from './namespace';
import { PasswordResetEvent } from './password-reset';
import { UserEvent } from './user';
import { WebSocketEvent } from './web-socket';

export interface SetupOptions extends nats.ConnectionOptions {
  database: string;
  durable: string;
}

export async function setup(options: SetupOptions) {
  await nats.connect({ connectionString: options.connectionString });
  await nats.upsertStream(options.database);

  Promise.all([
    subscribe(options.database, options.durable, Authorization, (payload) =>
      AuthorizationEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, AuthorizationRequest, (payload) =>
      AuthorizationRequestEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, Login, (payload) => LoginEvent.emit(payload)),
    subscribe(options.database, options.durable, Namespace, (payload) =>
      NamespaceEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, PasswordReset, (payload) =>
      PasswordResetEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, User, (payload) => UserEvent.emit(payload)),
    subscribe(options.database, options.durable, WebSocket, (payload) =>
      WebSocketEvent.emit(payload),
    ),
  ]).catch((err) => console.error(err));
}
