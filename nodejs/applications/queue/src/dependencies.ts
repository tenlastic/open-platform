import * as injector from '@tenlastic/dependency-injection';
import {
  ApiKeyInterceptor,
  ApiService,
  EnvironmentService,
  GameServerService,
  MatchService,
  QueueMemberService,
  QueueMemberState,
  QueueService,
  QueueState,
  RetryInterceptor,
  SubscriptionService,
  WebSocketService,
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
    deps: [ApiService, EnvironmentService],
    provide: GameServerService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new GameServerService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: MatchService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new MatchService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService, WebSocketService],
    provide: QueueMemberService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      webSocketService: WebSocketService,
    ) => new QueueMemberService(apiService, environmentService, webSocketService),
  },
  {
    deps: [QueueMemberService],
    provide: QueueMemberState,
    useFactory: (queueMemberService: QueueMemberService) =>
      new QueueMemberState(queueMemberService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: QueueService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new QueueService(apiService, environmentService),
  },
  {
    deps: [QueueService],
    provide: QueueState,
    useFactory: (queueService: QueueService) => new QueueState(queueService),
  },
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
  {
    deps: [ApiService, EnvironmentService],
    provide: WebSocketService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new WebSocketService(apiService, environmentService),
  },
]);

export default {
  apiService: injector.get(ApiService),
  axios: injector.get(Axios),
  environmentService: injector.get(EnvironmentService),
  gameServerService: injector.get(GameServerService),
  matchService: injector.get(MatchService),
  queueMemberService: injector.get(QueueMemberService),
  queueMemberState: injector.get(QueueMemberState),
  queueService: injector.get(QueueService),
  queueState: injector.get(QueueState),
  subscriptionService: injector.get(SubscriptionService),
  webSocketService: injector.get(WebSocketService),
};
