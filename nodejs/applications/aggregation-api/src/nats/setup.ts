import {
  Authorization,
  Group,
  Namespace,
  QueueMember,
  Storefront,
  User,
  WebSocket,
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
    subscribe(options.database, options.durable, Authorization, (payload) =>
      AuthorizationEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, Group, (payload) => GroupEvent.emit(payload)),
    subscribe(options.database, options.durable, Namespace, (payload) =>
      NamespaceEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, QueueMember, (payload) =>
      QueueMemberEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, Storefront, (payload) =>
      StorefrontEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, User, (payload) => UserEvent.emit(payload)),
    subscribe(options.database, options.durable, WebSocket, (payload) =>
      WebSocketEvent.emit(payload),
    ),
  ]).catch((err) => console.error(err));
}
