import * as injector from '@tenlastic/dependency-injection';
import {
  ApiKeyInterceptor,
  ApiService,
  EnvironmentService,
  GameServerService,
  GameServerStore,
  QueueMemberQuery,
  QueueMemberService,
  QueueMemberStore,
  QueueQuery,
  QueueService,
  QueueStore,
  StreamService,
} from '@tenlastic/http';
import { Axios } from 'axios';

const apiKey = process.env.API_KEY;
const apiUrl = process.env.API_URL;

injector.inject([
  {
    deps: [Axios, EnvironmentService],
    provide: ApiKeyInterceptor,
    useFactory: (axios: Axios, environmentService: EnvironmentService) =>
      new ApiKeyInterceptor(axios, environmentService),
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
    deps: [EnvironmentService],
    provide: StreamService,
    useFactory: (environmentService: EnvironmentService) =>
      new StreamService(environmentService, null),
  },
]);

export default {
  apiService: injector.get(ApiService),
  axios: injector.get(Axios),
  environmentService: injector.get(EnvironmentService),
  gameServerService: injector.get(GameServerService),
  gameServerStore: injector.get(GameServerStore),
  queueMemberQuery: injector.get(QueueMemberQuery),
  queueMemberService: injector.get(QueueMemberService),
  queueMemberStore: injector.get(QueueMemberStore),
  queueQuery: injector.get(QueueQuery),
  queueService: injector.get(QueueService),
  queueStore: injector.get(QueueStore),
  streamService: injector.get(StreamService),
};
