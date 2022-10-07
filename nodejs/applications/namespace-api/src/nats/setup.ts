import { publish, subscribe } from '@tenlastic/mongoose-change-stream-nats';
import * as nats from '@tenlastic/nats';

import {
  Article,
  Authorization,
  Build,
  Collection,
  GameServer,
  Group,
  Namespace,
  OnArticleProduced,
  OnBuildProduced,
  OnCollectionProduced,
  OnGameServerProduced,
  OnQueueMemberProduced,
  OnQueueProduced,
  OnRecordProduced,
  OnStorefrontProduced,
  OnWebSocketProduced,
  OnWorkflowProduced,
  QueueMember,
  Queue,
  Storefront,
  User,
  WebSocket,
  Workflow,
} from '../mongodb';
import { ArticleEvent } from './article';
import { AuthorizationEvent } from './authorization';
import { BuildEvent } from './build';
import { CollectionEvent } from './collection';
import { GameServerEvent } from './game-server';
import { GroupEvent } from './group';
import { NamespaceEvent } from './namespace';
import { QueueEvent } from './queue';
import { QueueMemberEvent } from './queue-member';
import { StorefrontEvent } from './storefront';
import { UserEvent } from './user';
import { WebSocketEvent } from './web-socket';
import { WorkflowEvent } from './workflow';

export interface SetupOptions extends nats.ConnectionOptions {
  durable: string;
}

export async function setup(options: SetupOptions) {
  await nats.connect({ connectionString: options.connectionString });

  OnArticleProduced.sync(publish);
  OnBuildProduced.sync(publish);
  OnCollectionProduced.sync(publish);
  OnGameServerProduced.sync(publish);
  OnQueueMemberProduced.sync(publish);
  OnQueueProduced.sync(publish);
  OnRecordProduced.sync(publish);
  OnStorefrontProduced.sync(publish);
  OnWebSocketProduced.sync(publish);
  OnWorkflowProduced.sync(publish);

  return Promise.all([
    subscribe(options.durable, Article, (payload) => ArticleEvent.emit(payload)),
    subscribe(options.durable, Authorization, (payload) => AuthorizationEvent.emit(payload)),
    subscribe(options.durable, Build, (payload) => BuildEvent.emit(payload)),
    subscribe(options.durable, Collection, (payload) => CollectionEvent.emit(payload)),
    subscribe(options.durable, GameServer, (payload) => GameServerEvent.emit(payload)),
    subscribe(options.durable, Group, (payload) => GroupEvent.emit(payload)),
    subscribe(options.durable, Namespace, (payload) => NamespaceEvent.emit(payload)),
    subscribe(options.durable, QueueMember, (payload) => QueueMemberEvent.emit(payload)),
    subscribe(options.durable, Queue, (payload) => QueueEvent.emit(payload)),
    subscribe(options.durable, Storefront, (payload) => StorefrontEvent.emit(payload)),
    subscribe(options.durable, User, (payload) => UserEvent.emit(payload)),
    subscribe(options.durable, WebSocket, (payload) => WebSocketEvent.emit(payload)),
    subscribe(options.durable, Workflow, (payload) => WorkflowEvent.emit(payload)),
  ]);
}
