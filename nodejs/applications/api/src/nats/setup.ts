import {
  AuthorizationModel,
  AuthorizationRequestModel,
  LoginModel,
  NamespaceModel,
  PasswordResetModel,
  UserModel,
} from '@tenlastic/mongoose';
import { subscribe } from '@tenlastic/mongoose-change-stream-nats';
import * as nats from '@tenlastic/nats';

import { AuthorizationEvent } from './authorization';
import { AuthorizationRequestEvent } from './authorization-request';
import { LoginEvent } from './login';
import { NamespaceEvent } from './namespace';
import { PasswordResetEvent } from './password-reset';
import { UserEvent } from './user';

export interface SetupOptions extends nats.ConnectionOptions {
  database: string;
  durable: string;
}

export async function setup(options: SetupOptions) {
  await nats.connect({ connectionString: options.connectionString });
  await nats.upsertStream(options.database);

  Promise.all([
    subscribe(options.database, options.durable, AuthorizationModel, (payload) =>
      AuthorizationEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, AuthorizationRequestModel, (payload) =>
      AuthorizationRequestEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, LoginModel, (payload) => LoginEvent.emit(payload)),
    subscribe(options.database, options.durable, NamespaceModel, (payload) =>
      NamespaceEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, PasswordResetModel, (payload) =>
      PasswordResetEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, UserModel, (payload) => UserEvent.emit(payload)),
  ]).catch((err) => console.error(err));
}
