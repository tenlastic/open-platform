import {
  AuthorizationModel,
  GroupModel,
  NamespaceModel,
  QueueMemberModel,
  StorefrontModel,
  UserModel,
  WebSocketModel,
} from '@tenlastic/mongoose';
import { subscribe } from '@tenlastic/mongoose-change-stream-nats';
import * as nats from '@tenlastic/nats';

import { AuthorizationEvent } from './authorization';
import { GroupEvent } from './group';
import { NamespaceEvent } from './namespace';
import { QueueMemberEvent } from './queue-member';
import { StorefrontEvent } from './storefront';
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
    subscribe(options.database, options.durable, AuthorizationModel, (payload) =>
      AuthorizationEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, GroupModel, (payload) => GroupEvent.emit(payload)),
    subscribe(options.database, options.durable, NamespaceModel, (payload) =>
      NamespaceEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, QueueMemberModel, (payload) =>
      QueueMemberEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, StorefrontModel, (payload) =>
      StorefrontEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, UserModel, (payload) => UserEvent.emit(payload)),
    subscribe(options.database, options.durable, WebSocketModel, (payload) =>
      WebSocketEvent.emit(payload),
    ),
  ]).catch((err) => console.error(err));
}
