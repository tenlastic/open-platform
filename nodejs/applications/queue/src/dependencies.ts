import * as injector from '@tenlastic/dependency-injection';
import {
  ApiKeyInterceptor,
  ApiService,
  EnvironmentService,
  GameServerService,
  GameServerStore,
  MatchQuery,
  MatchService,
  MatchStore,
  QueueMemberQuery,
  QueueMemberService,
  QueueMemberStore,
  QueueQuery,
  QueueService,
  QueueStore,
  RetryInterceptor,
  SubscriptionService,
  WebSocketService,
  WebSocketStore,
} from '@tenlastic/http';
import { Axios } from 'axios';

const apiKey = process.env.API_KEY;
const apiUrl = process.env.API_URL;

injector.inject([
  {
    deps: [Axios, EnvironmentService, WebSocketService],
    provide: ApiKeyInterceptor,
    useFactory: (
      axios: Axios,
      environmentService: EnvironmentService,
      webSocketService: WebSocketService,
    ) => new ApiKeyInterceptor(axios, environmentService, webSocketService),
  },
  {
    deps: [Axios],
    provide: ApiService,
    useFactory: (axios: Axios) => new ApiService(axios),
  },
  { provide: Axios, useValue: new Axios() },
  { provide: EnvironmentService, useValue: new EnvironmentService({ apiKey, apiUrl }) },
  {
    deps: [ApiService, EnvironmentService, GameServerStore],
    provide: GameServerService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      gameServerStore: GameServerStore,
    ) => new GameServerService(apiService, environmentService, gameServerStore),
  },
  { provide: GameServerStore, useValue: new GameServerStore() },
  {
    deps: [MatchStore],
    provide: MatchQuery,
    useFactory: (matchStore: MatchStore) => new MatchQuery(matchStore),
  },
  {
    deps: [ApiService, EnvironmentService, MatchStore],
    provide: MatchService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      matchStore: MatchStore,
    ) => new MatchService(apiService, environmentService, matchStore),
  },
  { provide: MatchStore, useValue: new MatchStore() },
  {
    deps: [QueueMemberStore],
    provide: QueueMemberQuery,
    useFactory: (queueMemberStore: QueueMemberStore) => new QueueMemberQuery(queueMemberStore),
  },
  {
    deps: [ApiService, EnvironmentService, QueueMemberStore],
    provide: QueueMemberService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      queueMemberStore: QueueMemberStore,
    ) => new QueueMemberService(apiService, environmentService, queueMemberStore),
  },
  { provide: QueueMemberStore, useValue: new QueueMemberStore() },
  {
    deps: [QueueStore],
    provide: QueueQuery,
    useFactory: (queueStore: QueueStore) => new QueueQuery(queueStore),
  },
  {
    deps: [ApiService, EnvironmentService, QueueStore],
    provide: QueueService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      queueStore: QueueStore,
    ) => new QueueService(apiService, environmentService, queueStore),
  },
  { provide: QueueStore, useValue: new QueueStore() },
  {
    deps: [Axios],
    provide: RetryInterceptor,
    useFactory: (axios: Axios) => new RetryInterceptor(axios),
  },
  {
    deps: [WebSocketService],
    provide: SubscriptionService,
    useFactory: (webSocketService: WebSocketService) => new SubscriptionService(webSocketService),
  },
  { provide: WebSocketStore, useValue: new WebSocketStore() },
  {
    deps: [ApiService, EnvironmentService, WebSocketStore],
    provide: WebSocketService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      webSocketStore: WebSocketStore,
    ) => new WebSocketService(apiService, environmentService, webSocketStore),
  },
]);

export default {
  apiService: injector.get(ApiService),
  axios: injector.get(Axios),
  environmentService: injector.get(EnvironmentService),
  gameServerService: injector.get(GameServerService),
  gameServerStore: injector.get(GameServerStore),
  matchQuery: injector.get(MatchQuery),
  matchService: injector.get(MatchService),
  matchStore: injector.get(MatchStore),
  queueMemberQuery: injector.get(QueueMemberQuery),
  queueMemberService: injector.get(QueueMemberService),
  queueMemberStore: injector.get(QueueMemberStore),
  queueQuery: injector.get(QueueQuery),
  queueService: injector.get(QueueService),
  queueStore: injector.get(QueueStore),
  subscriptionService: injector.get(SubscriptionService),
  webSocketService: injector.get(WebSocketService),
};
