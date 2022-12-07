import {
  ArticleModel,
  AuthorizationModel,
  BuildModel,
  CollectionModel,
  GameServerModel,
  GroupModel,
  MatchModel,
  NamespaceModel,
  QueueMemberModel,
  QueueModel,
  StorefrontModel,
  UserModel,
  WebSocketModel,
  WorkflowModel,
} from '@tenlastic/mongoose';
import { subscribe } from '@tenlastic/mongoose-change-stream-nats';
import * as nats from '@tenlastic/nats';

import { ArticleEvent } from './article';
import { AuthorizationEvent } from './authorization';
import { BuildEvent } from './build';
import { CollectionEvent } from './collection';
import { GameServerEvent } from './game-server';
import { GroupEvent } from './group';
import { MatchEvent } from './match';
import { GlobalNamespaceEvent, NamespaceEvent } from './namespace';
import { QueueEvent } from './queue';
import { QueueMemberEvent } from './queue-member';
import { StorefrontEvent } from './storefront';
import { UserEvent } from './user';
import { WebSocketEvent } from './web-socket';
import { WorkflowEvent } from './workflow';

export interface SetupOptions extends nats.ConnectionOptions {
  database: string;
  durable: string;
  podName: string;
}

export async function setup(options: SetupOptions) {
  await nats.connect({ connectionString: options.connectionString });
  await nats.upsertStream(options.database, { max_age: 0, max_bytes: 250 * 1000 * 1000 });

  Promise.all([
    subscribe(options.database, options.durable, ArticleModel, (payload) =>
      ArticleEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, AuthorizationModel, (payload) =>
      AuthorizationEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, BuildModel, (payload) => BuildEvent.emit(payload)),
    subscribe(options.database, options.durable, CollectionModel, (payload) =>
      CollectionEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, GameServerModel, (payload) =>
      GameServerEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, GroupModel, (payload) => GroupEvent.emit(payload)),
    subscribe(options.database, options.durable, MatchModel, (payload) => MatchEvent.emit(payload)),
    subscribe(options.database, options.durable, NamespaceModel, (payload) =>
      NamespaceEvent.emit(payload),
    ),
    subscribe(options.database, options.podName, NamespaceModel, (payload) =>
      GlobalNamespaceEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, QueueMemberModel, (payload) =>
      QueueMemberEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, QueueModel, (payload) => QueueEvent.emit(payload)),
    subscribe(options.database, options.durable, StorefrontModel, (payload) =>
      StorefrontEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, UserModel, (payload) => UserEvent.emit(payload)),
    subscribe(options.database, options.durable, WebSocketModel, (payload) =>
      WebSocketEvent.emit(payload),
    ),
    subscribe(options.database, options.durable, WorkflowModel, (payload) =>
      WorkflowEvent.emit(payload),
    ),
  ]).catch((err) => console.error(err.message));
}
