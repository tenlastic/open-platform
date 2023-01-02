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
    deps: [ApiService, EnvironmentService, QueueMemberStore, StreamService],
    provide: QueueMemberService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      queueMemberStore: QueueMemberStore,
      streamService: StreamService,
    ) => new QueueMemberService(apiService, environmentService, queueMemberStore, streamService),
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
  { provide: StreamService, useFactory: () => new StreamService() },
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
  streamService: injector.get(StreamService),
};
